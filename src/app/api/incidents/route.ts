import { NextRequest } from "next/server";

type Incident = {
  id: string;
  type: string;
  timestamp: string;
  address?: string;
  lat?: number;
  lng?: number;
  source?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  const radiusKm = parseFloat(searchParams.get("radiusKm") || "2");
  const days = parseInt(searchParams.get("days") || "7", 10);
  const mock = searchParams.get("mock") === "1";
  const debug = searchParams.get("debug") === "1";
  const strict = searchParams.get("strict") === "1";
  const attempts: any[] = [];

  if (!isFinite(lat) || !isFinite(lng)) {
    return new Response(JSON.stringify({ error: "lat and lng are required" }), { status: 400 });
  }

  try {
    let incidents: Incident[] = [];

    if (mock) {
      incidents = mockIncidents(lat, lng);
    } else {
      const torontoMciUrl = process.env.TORONTO_MCI_FEATURE_URL;
      if (torontoMciUrl) {
        incidents = await fetchTorontoMCIAttr(torontoMciUrl, { lat, lng, radiusKm, days }, attempts);
      } else {
        incidents = mockIncidents(lat, lng);
      }
    }

    // Optionally filter by days here once real data has timestamps
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const preFilterCount = incidents.length;
    let filtered = incidents.filter((i) => {
      const t = new Date(i.timestamp).getTime();
      return isFinite(t) ? t >= cutoff : true;
    });

    // Fallback: if filter removes everything but we had data, return unfiltered (unless strict)
    let filterFallback = false;
    if (!strict && filtered.length === 0 && preFilterCount > 0) {
      filtered = incidents;
      filterFallback = true;
    }

    const payload: any = { radiusKm, days, count: filtered.length, incidents: filtered };
    if (filterFallback) {
      payload.notice = `No incidents in the last ${days} day(s) within ${radiusKm}km; showing nearby historical results.`;
    }
    if (debug) {
      payload.debug = {
        lat,
        lng,
        attempts,
        preFilterCount,
        filterFallback,
        env: { hasTorontoMciUrl: Boolean(process.env.TORONTO_MCI_FEATURE_URL) },
      };
    }
    return Response.json(payload);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "unknown error" }), { status: 500 });
  }
}

function mockIncidents(lat: number, lng: number): Incident[] {
  const now = Date.now();
  const mk = (i: number, dx: number, dy: number, type: string): Incident => ({
    id: `mock-${i}`,
    type,
    timestamp: new Date(now - i * 60 * 60 * 1000).toISOString(),
    address: "Near searched area",
    lat: lat + dx,
    lng: lng + dy,
    source: "mock",
  });
  return [
    mk(1, 0.002, -0.001, "Police - Property Damage"),
    mk(2, -0.0015, 0.001, "Police - Assault"),
    mk(4, 0.001, 0.0015, "Police - Break and Enter"),
  ];
}

// Removed generic ArcGIS radius fetcher; Toronto dashboard uses attribute-based MCI fetch

function bboxFromPoint(lat: number, lng: number, radiusKm: number) {
  const R = 6371; // Earth radius km
  const d = radiusKm / R; // angular distance in radians
  const latRad = (lat * Math.PI) / 180;
  const dLat = (radiusKm / 111.32); // approx degrees of latitude per km
  const dLng = (radiusKm / (111.32 * Math.cos(latRad)));
  const xmin = lng - dLng;
  const xmax = lng + dLng;
  const ymin = lat - dLat;
  const ymax = lat + dLat;
  return {
    xmin,
    ymin,
    xmax,
    ymax,
    spatialReference: { wkid: 4326 },
  } as const;
}

// No server-side date WHERE; filtering handled after fetch with fallback messaging

async function fetchTorontoMCIAttr(
  featureUrl: string,
  opts: { lat: number; lng: number; radiusKm: number; days: number },
  debugLog?: any[]
): Promise<Incident[]> {
  const { lat, lng, radiusKm, days } = opts;
  // Build attribute where with lat/lng bounding box to keep response small
  const envelope = bboxFromPoint(lat, lng, radiusKm);
  const where = [
    `LAT_WGS84 >= ${envelope.ymin}`,
    `LAT_WGS84 <= ${envelope.ymax}`,
    `LONG_WGS84 >= ${envelope.xmin}`,
    `LONG_WGS84 <= ${envelope.xmax}`,
  ].join(" AND ");

  const url = new URL(featureUrl.replace(/\/$/, "") + "/query");
  url.searchParams.set("f", "json");
  url.searchParams.set("outFields", "OBJECTID,OFFENCE,MCI_CATEGORY,OCC_DATE,OCC_HOUR,REPORT_DATE,REPORT_HOUR,LAT_WGS84,LONG_WGS84,NEIGHBOURHOOD_140,NEIGHBOURHOOD_158");
  url.searchParams.set("where", where);
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("orderByFields", "OCC_DATE DESC");
  url.searchParams.set("resultRecordCount", "1000");
  url.searchParams.set("returnExceededLimitFeatures", "true");

  let features: any[] = [];
  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = res.ok ? await res.json() : null;
    if (debugLog) {
      debugLog.push({ source: "toronto-mci", note: "attr-bbox", url: url.toString(), status: res.status, ok: res.ok, count: Array.isArray(data?.features) ? data.features.length : -1 });
    }
    features = Array.isArray(data?.features) ? data.features : [];
  } catch (err: any) {
    if (debugLog) debugLog.push({ source: "toronto-mci", note: "attr-bbox-error", error: err?.message });
  }

  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  const items: Incident[] = features
    .map((f: any) => {
      const a = f.attributes || {};
      const id = String(a.OBJECTID ?? a.ObjectID ?? a.objectid ?? cryptoRandomId());
      const latA = parseFloat(a.LAT_WGS84);
      const lngA = parseFloat(a.LONG_WGS84);
      const type = a.OFFENCE || a.MCI_CATEGORY || "Incident";

      // Build timestamp from OCC_DATE + OCC_HOUR (fallback to REPORT_*), default to midnight if missing
      let ts: string | null = null;
      const occEpoch = typeof a.OCC_DATE === "number" ? a.OCC_DATE : undefined;
      const occHour = a.OCC_HOUR != null ? parseInt(String(a.OCC_HOUR), 10) : undefined;
      const repEpoch = typeof a.REPORT_DATE === "number" ? a.REPORT_DATE : undefined;
      const repHour = a.REPORT_HOUR != null ? parseInt(String(a.REPORT_HOUR), 10) : undefined;
      const buildIso = (epoch: number | undefined, hour: number | undefined) => {
        if (epoch == null || !isFinite(epoch)) return null;
        const d = new Date(epoch);
        const y = d.getUTCFullYear();
        const m = d.getUTCMonth();
        const day = d.getUTCDate();
        const h = Number.isFinite(hour as any) ? (hour as number) : 0;
        return new Date(Date.UTC(y, m, day, h, 0, 0)).toISOString();
      };
      ts = buildIso(occEpoch, occHour) || buildIso(repEpoch, repHour) || normalizeArcgisDate(a.OCC_DATE) || normalizeArcgisDate(a.REPORT_DATE) || new Date().toISOString();

      return { id, type, timestamp: ts, lat: latA, lng: lngA, address: a.NEIGHBOURHOOD_140 || a.NEIGHBOURHOOD_158, source: "toronto-mci" } as Incident;
    })
    .filter((i) => isFinite(i.lat as any) && isFinite(i.lng as any));

  // Filter by precise radius and days on server
  const inside = items.filter((i) => {
    const t = new Date(i.timestamp).getTime();
    const okDate = isFinite(t) ? t >= cutoff : true;
    const d = haversineKm(lat, lng, i.lat!, i.lng!);
    return okDate && d <= radiusKm;
  });

  if (debugLog) {
    debugLog.push({ source: "toronto-mci", note: "post-filter", kept: inside.length, total: items.length });
  }

  return inside;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Removed generic attribute mapping helper; handled within MCI fetch

function normalizeArcgisDate(v: any): string | null {
  if (v == null) return null;
  if (typeof v === "number") {
    // ArcGIS time fields are epoch millis
    try {
      return new Date(v).toISOString();
    } catch {
      return null;
    }
  }
  if (typeof v === "string") {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

// Toronto-only dashboard — no other regional bbox helpers
