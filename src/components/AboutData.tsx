"use client";

import { useEffect, useState } from "react";

type Meta = {
  lastUpdated?: number;
  source?: string;
};

export default function AboutData() {
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState<Meta | null>(null);

  useEffect(() => {
    if (!open || meta) return;
    fetch("/api/meta", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setMeta(j))
      .catch(() => setMeta({}));
  }, [open, meta]);

  const last = meta?.lastUpdated ? new Date(meta.lastUpdated).toLocaleString("en-CA", { timeZone: "America/Toronto", timeZoneName: "short" }) : "Unknown";

  return (
    <div className="mt-2">
      <button onClick={() => setOpen(true)} className="text-xs underline opacity-80 hover:opacity-100">About the data</button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="max-w-lg w-[92%] bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-black/10 dark:border-white/15 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold">About the Data</h3>
              <button onClick={() => setOpen(false)} className="text-sm opacity-70 hover:opacity-100">Close</button>
            </div>
            <ul className="text-sm space-y-2">
              <li><b>Source:</b> Toronto Police Service Major Crime Indicators</li>
              <li><b>Service:</b> <a className="underline" href={meta?.source || "#"} target="_blank" rel="noreferrer">ArcGIS FeatureServer (Open Data)</a></li>
              <li><b>Last updated:</b> {last}</li>
              <li><b>Notes:</b> Times are reported in Eastern Time (EST/EDT). Occurrence hour is taken from OCC_HOUR when available; otherwise report time is used.</li>
              <li><b>Limitations:</b> Public data may be batched or delayed. Nearby results may include historical incidents when a selected window is empty.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

