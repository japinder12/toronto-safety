import { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  const src = process.env.TORONTO_MCI_FEATURE_URL;
  if (!src) return Response.json({ error: "missing TORONTO_MCI_FEATURE_URL" }, { status: 500 });
  try {
    const url = new URL(src.replace(/\/$/, "") + "?f=json");
    const r = await fetch(url.toString(), { cache: "no-store" });
    const j = await r.json();
    const last = j?.editingInfo?.lastEditDate || j?.editorTrackingInfo?.lastEditDate || j?.serviceItemIdLastModified || null;
    return Response.json({ lastUpdated: last, source: src });
  } catch (e: any) {
    return Response.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

