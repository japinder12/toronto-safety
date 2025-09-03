import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postal = (searchParams.get("postal") || "").trim();
  if (!postal) {
    return new Response(JSON.stringify({ error: "postal is required" }), { status: 400 });
  }

  // Nominatim geocoding for Canadian postal codes
  const base = "https://nominatim.openstreetmap.org/search";
  const compact = postal.toUpperCase().replace(/\s+/g, "");
  const fsa = compact.slice(0, 3);
  const urlPostal = new URL(base);
  urlPostal.searchParams.set("format", "json");
  urlPostal.searchParams.set("limit", "1");
  urlPostal.searchParams.set("countrycodes", "ca");
  urlPostal.searchParams.set("addressdetails", "1");
  urlPostal.searchParams.set("postalcode", compact);

  const headers = {
    "User-Agent": process.env.GEOCODE_USER_AGENT || "toronto-safety-app/0.1 (contact: please-set-GEOCODE_USER_AGENT)",
    Referer: process.env.GEOCODE_REFERER || "http://localhost:3000",
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

    // Try multiple strategies if empty
    const attempts: URL[] = [];
    if (!data.length) {
      const urlQ1 = new URL(base);
      urlQ1.searchParams.set("format", "json");
      urlQ1.searchParams.set("limit", "1");
      urlQ1.searchParams.set("countrycodes", "ca");
      urlQ1.searchParams.set("addressdetails", "1");
      urlQ1.searchParams.set("q", `${compact}`);
      attempts.push(urlQ1);

      const urlQ2 = new URL(base);
      urlQ2.searchParams.set("format", "json");
      urlQ2.searchParams.set("limit", "1");
      urlQ2.searchParams.set("countrycodes", "ca");
      urlQ2.searchParams.set("addressdetails", "1");
      urlQ2.searchParams.set("q", `${compact}, Ontario, Canada`);
      attempts.push(urlQ2);

      const urlQ3 = new URL(base);
      urlQ3.searchParams.set("format", "json");
      urlQ3.searchParams.set("limit", "1");
      urlQ3.searchParams.set("countrycodes", "ca");
      urlQ3.searchParams.set("addressdetails", "1");
      urlQ3.searchParams.set("q", `${compact}, Canada`);
      attempts.push(urlQ3);

      // FSA fallback: first three characters (LDU center approximation)
      if (fsa && fsa.length === 3) {
        const urlQ4 = new URL(base);
        urlQ4.searchParams.set("format", "json");
        urlQ4.searchParams.set("limit", "1");
        urlQ4.searchParams.set("countrycodes", "ca");
        urlQ4.searchParams.set("addressdetails", "1");
        urlQ4.searchParams.set("q", `${fsa}, Ontario, Canada`);
        attempts.push(urlQ4);
      }

      for (const u of attempts) {
        const r = await fetch(u.toString(), { headers: { ...headers }, cache: "no-store" });
        if (!r.ok) continue;
        const j = (await r.json()) as any[];
        if (Array.isArray(j) && j.length) {
          data = j;
          break;
        }
      }
      if (!data.length) return new Response(JSON.stringify({ error: "no results" }), { status: 404 });
    }
    // Prefer Ontario, CA results
    const pick = preferOntarioCanada(data) || data[0];
    const lat = parseFloat(pick.lat);
    const lon = parseFloat(pick.lon);
    return Response.json({ lat, lng: lon, raw: pick });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "unknown error" }), { status: 500 });
  }
}

function preferOntarioCanada(list: any[]): any | null {
  const ca = list.filter((x) => x?.address?.country_code === "ca");
  const on = ca.filter((x) =>
    x?.address?.state === "Ontario" ||
    x?.address?.state_code === "ON" ||
    (typeof x?.addresstype === "string" && /ontario/i.test(x.display_name || "")) ||
    /CA-ON/.test(x?.address?.['ISO3166-2-lvl4'] || "")
  );
  if (on.length) return on[0];
  if (ca.length) return ca[0];
  return null;
}
