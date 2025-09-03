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
  const regionParam = "";
  const days = parseInt(searchParams.get("days") || "7", 10);
  const mock = searchParams.get("mock") === "1";
  const allowedSources = null;
  const debug = searchParams.get("debug") === "1";
  let wantsPeel = false;
  let wantsToronto = true;
  const attempts: any[] = [];
  const singleRegion = "toronto";

  if (!isFinite(lat) || !isFinite(lng)) {
    return new Response(JSON.stringify({ error: "lat and lng are required" }), { status: 400 });
  }

  try {
    let incidents: Incident[] = [];

    if (mock) {
      incidents = mockIncidents(lat, lng);
    } else {
      // Auto-detect region: if a ?region param is passed, prefer that; otherwise use bbox heuristics; if uncertain, query all configured.
      const torontoMciUrl = process.env.TORONTO_MCI_FEATURE_URL;
      // Toronto-only dashboard
      wantsPeel = false;
      wantsToronto = true;
      const tasks: Promise<Incident[]>[] = [];
      if (wantsToronto || (!wantsPeel && !wantsToronto)) {
        if (torontoMciUrl)
          tasks.push(
            fetchTorontoMCIAttr(torontoMciUrl, { lat, lng, radiusKm, days }, attempts)
          );
      }

      if (tasks.length === 0) {
        incidents = mockIncidents(lat, lng);
      } else {
        const results = await Promise.allSettled(tasks);
        incidents = results
          .filter((r): r is PromiseFulfilledResult<Incident[]> => r.status === "fulfilled")
          .flatMap((r) => r.value);
        // basic de-dup by id+source
        const seen = new Set<string>();
        incidents = incidents.filter((i) => {
          const key = `${i.source || ""}:${i.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
    }

    // Optionally filter by days here once real data has timestamps
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const preFilterCount = incidents.length;
    let filtered = incidents.filter((i) => {
      const t = new Date(i.timestamp).getTime();
      return isFinite(t) ? t >= cutoff : true;
    });

    if (allowedSources) {
      filtered = filtered.filter((i) => (i.source ? allowedSources.has(i.source) : true));
    }

    // Fallback: if filter removes everything but we had data, return unfiltered to ensure UI shows something during setup
    let filterFallback = false;
    if (filtered.length === 0 && preFilterCount > 0) {
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
        env: {
          hasTorontoMciUrl: Boolean(process.env.TORONTO_MCI_FEATURE_URL),
        },
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

async function fetchArcgisByRadius(
  featureUrl: string,
  opts: { lat: number; lng: number; radiusKm: number; days: number },
  sourceTag: string,
  debugLog?: any[]
): Promise<Incident[]> {
  const { lat, lng, radiusKm, days } = opts;
  const url = new URL(featureUrl.replace(/\/$/, "") + "/query");

  const geometry = { x: lng, y: lat, spatialReference: { wkid: 4326 } } as const;

  url.searchParams.set("f", "json");
  url.searchParams.set("outFields", "*");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("geometry", JSON.stringify(geometry));
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("distance", String(Math.max(0.1, radiusKm) * 1000));
  url.searchParams.set("units", "esriSRUnit_Meter");
  url.searchParams.set("where", "1=1");
  url.searchParams.set("resultRecordCount", "300");
  url.searchParams.set("returnExceededLimitFeatures", "true");

  let features: any[] = [];
  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = res.ok ? await res.json() : null;
    if (debugLog) {
      debugLog.push({
        source: sourceTag,
        note: "point-buffer-meters",
        url: url.toString(),
        status: res.status,
        ok: res.ok,
        count: Array.isArray(data?.features) ? data.features.length : -1,
      });
    }
    features = Array.isArray(data?.features) ? data.features : [];
  } catch (err: any) {
    if (debugLog) {
      debugLog.push({ source: sourceTag, note: "point-buffer-meters-error", url: url.toString(), error: err?.message });
    }
  }

  // Fallback: if no features, try kilometers unit in case server expects that literal constant
  if (features.length === 0) {
    const url2 = new URL(url.toString());
    url2.searchParams.set("distance", String(Math.max(0.1, radiusKm)));
    url2.searchParams.set("units", "esriSRUnit_Kilometer");
    url2.searchParams.set("where", "1=1");
    try {
      const res2 = await fetch(url2.toString(), { cache: "no-store" });
      const data2 = res2.ok ? await res2.json() : null;
      if (debugLog) {
        debugLog.push({
          source: sourceTag,
          note: "point-buffer-kilometers",
          url: url2.toString(),
          status: res2.status,
          ok: res2.ok,
          count: Array.isArray(data2?.features) ? data2.features.length : -1,
        });
      }
      if (Array.isArray(data2?.features)) features = data2.features;
    } catch (err: any) {
      if (debugLog) {
        debugLog.push({ source: sourceTag, note: "point-buffer-kilometers-error", url: url2.toString(), error: err?.message });
      }
    }
  }

  // Fallback: try a bounding box (envelope) which is widely supported
  if (features.length === 0) {
    const envelope = bboxFromPoint(lat, lng, radiusKm);
    const url3 = new URL(featureUrl.replace(/\/$/, "") + "/query");
    url3.searchParams.set("f", "json");
    url3.searchParams.set("outFields", "*");
    url3.searchParams.set("outSR", "4326");
    url3.searchParams.set("returnGeometry", "true");
    url3.searchParams.set("geometry", JSON.stringify(envelope));
    url3.searchParams.set("geometryType", "esriGeometryEnvelope");
    url3.searchParams.set("inSR", "4326");
    url3.searchParams.set("spatialRel", "esriSpatialRelIntersects");
    url3.searchParams.set("where", "1=1");
    url3.searchParams.set("resultRecordCount", "300");
    url3.searchParams.set("returnExceededLimitFeatures", "true");
    try {
      const res3 = await fetch(url3.toString(), { cache: "no-store" });
      const data3 = res3.ok ? await res3.json() : null;
      if (debugLog) {
        debugLog.push({
          source: sourceTag,
          note: "envelope-bbox",
          url: url3.toString(),
          status: res3.status,
          ok: res3.ok,
          count: Array.isArray(data3?.features) ? data3.features.length : -1,
        });
      }
      if (Array.isArray(data3?.features)) features = data3.features;
    } catch (err: any) {
      if (debugLog) {
        debugLog.push({ source: sourceTag, note: "envelope-bbox-error", url: url3.toString(), error: err?.message });
      }
    }
  }
  const items: Incident[] = features
    .map((f: any) => {
      const g = f.geometry || {};
      const a = f.attributes || {};
      const { lat: plat, lng: plng } = arcgisToLatLng(g);
      const mapped = mapArcgisAttributes(a, plat, plng, sourceTag);
      return mapped;
    })
    .filter(Boolean) as Incident[];
  if (debugLog && features.length) {
    const a = features[0]?.attributes || {};
    debugLog.push({ source: sourceTag, sampleAttributeKeys: Object.keys(a), itemsCount: items.length });
  }
  return items;
}

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
  url.searchParams.set("outFields", "OBJECTID,OFFENCE,MCI_CATEGORY,OCC_DATE,LAT_WGS84,LONG_WGS84,NEIGHBOURHOOD_140,NEIGHBOURHOOD_158");
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
      const timestamp = normalizeArcgisDate(a.OCC_DATE) || new Date().toISOString();
      return { id, type, timestamp, lat: latA, lng: lngA, address: a.NEIGHBOURHOOD_140 || a.NEIGHBOURHOOD_158, source: "toronto-mci" } as Incident;
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

function arcgisToLatLng(g: any): { lat?: number; lng?: number } {
  if (!g) return {};
  if (typeof g.y === "number" && typeof g.x === "number") {
    return { lat: g.y, lng: g.x };
  }
  if (typeof g.latitude === "number" && typeof g.longitude === "number") {
    return { lat: g.latitude, lng: g.longitude };
  }
  return {};
}

function mapArcgisAttributes(a: any, lat?: number, lng?: number, sourceTag?: string): Incident | null {
  // ID: prefer OBJECTID, else any known IDs, else random
  const id = String(
    a.OBJECTID ?? a.ObjectID ?? a.objectid ?? a.SERVICE_REQUEST_ID ?? a.SR_ID ?? a.EVENT_ID ?? a.Id ?? cryptoRandomId()
  );

  // Type/category: try crime/311 fields
  const type =
    a.OFFENCE ??
    a.OFFENSE ??
    a.CRIME ??
    a.CATEGORY ??
    a.MCI ??
    a.MajorCrime ??
    a.SERVICE_REQUEST_TYPE ??
    a.SERVICE_CATEGORY ??
    a.REQUEST_TYPE ??
    a.SERVICE_NAME ??
    a.Type ??
    a.Subtype ??
    "Incident";

  // Address/location
  const address = a.ADDRESS || a.FULL_ADDRESS || a.LOCATION || a.Location || a.Address || a.NEIGHBOURHOOD || undefined;

  // Date/time: support multiple common fields (epoch or ISO)
  const rawDate =
    a.OCC_DATE ??
    a.OCC_DATETIME ??
    a.OCCURRENCE_DATE ??
    a.OCCURRENCE_DATETIME ??
    a.EVENT_DATE ??
    a.REPORTED_DATE ??
    a.REPORT_DATE ??
    a.CALL_DATE ??
    a.CALLDATETIME ??
    a.CREATED_DATE ??
    a.CREATE_DATE ??
    a.CreationDate ??
    a.CREATION_DATE ??
    a.EditDate ??
    a.EDIT_DATE ??
    a.last_edited_date ??
    a.REQUESTED_DATETIME ??
    a.RECEIVED_DATE ??
    a.Date ??
    a.date;
  const timestamp = normalizeArcgisDate(rawDate) || new Date().toISOString();

  // Lat/Lng fallback from attributes when geometry is missing or empty
  let plat = lat;
  let plng = lng;
  const latAttr =
    a.LAT_WGS84 ?? a.Latitude ?? a.LATITUDE ?? a.LAT ?? a.Y ?? a.y ?? a.lat ?? a.dec_lat ?? undefined;
  const lngAttr =
    a.LONG_WGS84 ?? a.LONGITUDE ?? a.LON ?? a.LNG ?? a.X ?? a.x ?? a.lng ?? a.lon ?? a.dec_long ?? undefined;
  if ((plat == null || isNaN(plat as any)) && latAttr != null) {
    const n = typeof latAttr === "number" ? latAttr : parseFloat(String(latAttr));
    if (isFinite(n)) plat = n;
  }
  if ((plng == null || isNaN(plng as any)) && lngAttr != null) {
    const n = typeof lngAttr === "number" ? lngAttr : parseFloat(String(lngAttr));
    if (isFinite(n)) plng = n;
  }

  return { id, type, timestamp, address, lat: plat, lng: plng, source: sourceTag };
}

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
