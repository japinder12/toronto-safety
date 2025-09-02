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
  const regionParam = (searchParams.get("region") || "").toLowerCase();
  const days = parseInt(searchParams.get("days") || "7", 10);
  const mock = searchParams.get("mock") === "1";

  if (!isFinite(lat) || !isFinite(lng)) {
    return new Response(JSON.stringify({ error: "lat and lng are required" }), { status: 400 });
  }

  try {
    let incidents: Incident[] = [];

    if (mock) {
      incidents = mockIncidents(lat, lng);
    } else {
      // Auto-detect region: if a ?region param is passed, prefer that; otherwise use bbox heuristics; if uncertain, query all configured.
      const peelCrimeUrl = process.env.PEEL_CRIME_FEATURE_URL;
      const miss311Url = process.env.MISSISSAUGA_311_FEATURE_URL;
      const torontoMciUrl = process.env.TORONTO_MCI_FEATURE_URL;

      const wantsPeel = regionParam === "peel" || (regionParam === "" && inPeelBBox(lat, lng));
      const wantsToronto = regionParam === "toronto" || (regionParam === "" && inTorontoBBox(lat, lng));

      const tasks: Promise<Incident[]>[] = [];
      if (wantsPeel || (!wantsPeel && !wantsToronto)) {
        if (peelCrimeUrl) tasks.push(fetchArcgisByRadius(peelCrimeUrl, { lat, lng, radiusKm, days }, "peel-crime"));
        if (miss311Url) tasks.push(fetchArcgisByRadius(miss311Url, { lat, lng, radiusKm, days }, "mississauga-311"));
      }
      if (wantsToronto || (!wantsPeel && !wantsToronto)) {
        if (torontoMciUrl)
          tasks.push(fetchArcgisByRadius(torontoMciUrl, { lat, lng, radiusKm, days }, "toronto-mci"));
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
    const filtered = incidents.filter((i) => new Date(i.timestamp).getTime() >= cutoff);

    return Response.json({ radiusKm, days, count: filtered.length, incidents: filtered });
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
    mk(1, 0.002, -0.001, "311 - Noise Complaint"),
    mk(2, -0.0015, 0.001, "Police - Property Damage"),
    mk(4, 0.001, 0.0015, "Fire - Alarm"),
  ];
}

async function fetchArcgisByRadius(
  featureUrl: string,
  opts: { lat: number; lng: number; radiusKm: number; days: number },
  sourceTag: string
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
  url.searchParams.set("distance", String(radiusKm));
  url.searchParams.set("units", "esriSRUnit_Kilometer");
  url.searchParams.set("where", "1=1");
  url.searchParams.set("resultRecordCount", "300");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`ArcGIS query failed: ${res.status}`);
  const data = await res.json();

  const features = Array.isArray(data?.features) ? data.features : [];
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const items: Incident[] = features
    .map((f: any) => {
      const g = f.geometry || {};
      const a = f.attributes || {};
      const { lat: plat, lng: plng } = arcgisToLatLng(g);
      const mapped = mapArcgisAttributes(a, plat, plng, sourceTag);
      return mapped;
    })
    .filter(Boolean) as Incident[];

  // Keep items without timestamps; only filter those with a valid timestamp
  return items.filter((i) => {
    const t = new Date(i.timestamp).getTime();
    return isFinite(t) ? t >= cutoff : true;
  });
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

  return { id, type, timestamp, address, lat, lng, source: sourceTag };
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

function inTorontoBBox(lat: number, lng: number): boolean {
  const minLat = 43.58;
  const maxLat = 43.90;
  const minLng = -79.65;
  const maxLng = -79.12;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

function inPeelBBox(lat: number, lng: number): boolean {
  // Rough bbox covering Mississauga, Brampton, Caledon
  const minLat = 43.35;
  const maxLat = 44.20;
  const minLng = -80.20;
  const maxLng = -79.45;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}
