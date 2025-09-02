import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postal = (searchParams.get("postal") || "").trim();
  if (!postal) {
    return new Response(JSON.stringify({ error: "postal is required" }), { status: 400 });
  }

  // Nominatim geocoding for Canadian postal codes
  const base = "https://nominatim.openstreetmap.org/search";
  const urlPostal = new URL(base);
  urlPostal.searchParams.set("format", "json");
  urlPostal.searchParams.set("limit", "1");
  urlPostal.searchParams.set("country", "Canada");
  urlPostal.searchParams.set("postalcode", postal);

  const headers = {
    "User-Agent": "toronto-safety-app/0.1 (contact: example@example.com)",
    Referer: "http://localhost:3000",
  } as const;

  try {
    let res = await fetch(urlPostal.toString(), {
      headers: {
        ...headers,
      },
      // Nominatim wants no aggressive caching
      cache: "no-store",
    });
    let data: any[] = [];
    if (res.ok) data = (await res.json()) as any[];

    // Fallback: use free-text query if postalcode param returns nothing
    if (!data.length) {
      const urlQ = new URL(base);
      urlQ.searchParams.set("format", "json");
      urlQ.searchParams.set("limit", "1");
      urlQ.searchParams.set("q", `${postal}, Canada`);
      res = await fetch(urlQ.toString(), { headers: { ...headers }, cache: "no-store" });
      if (!res.ok) {
        return new Response(JSON.stringify({ error: `geocode failed: ${res.status}` }), { status: 500 });
      }
      data = (await res.json()) as any[];
      if (!data.length) {
        return new Response(JSON.stringify({ error: "no results" }), { status: 404 });
      }
    }
    const first = data[0];
    const lat = parseFloat(first.lat);
    const lon = parseFloat(first.lon);
    return Response.json({ lat, lng: lon, raw: first });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "unknown error" }), { status: 500 });
  }
}
