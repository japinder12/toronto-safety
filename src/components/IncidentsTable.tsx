"use client";

type Incident = {
  id: string;
  type: string;
  timestamp: string;
  address?: string;
  lat?: number;
  lng?: number;
  source?: string;
};

import { colorForType } from "@/lib/colors";

export default function IncidentsTable({ data, loading }: { data: Incident[]; loading?: boolean }) {
  return (
    <div className="w-full overflow-auto max-h-[60vh] rounded-md">
      <table className="w-full text-sm border-collapse tabular">
        <thead className="sticky top-0 z-10">
          <tr className="text-left border-b border-black/10 dark:border-white/20 bg-black/[.04] dark:bg-white/[.06] backdrop-blur supports-[backdrop-filter]:bg-black/5 shadow-[inset_0_-1px_0_rgba(0,0,0,.05)]">
            <th className="py-2 pr-4">Time (Eastern Time)</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Address</th>
            <th className="py-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="py-3" colSpan={4}>Loading…</td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td className="py-3" colSpan={4}>No incidents found in range.</td>
            </tr>
          ) : (
            data.map((i, idx) => {
              const t = new Date(i.timestamp);
              const ts = isNaN(t.getTime())
                ? "Unknown"
                : t.toLocaleString("en-CA", {
                    timeZone: "America/Toronto",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                    timeZoneName: "short",
                  });
              return (
              <tr key={i.id} className={`border-b border-black/5 dark:border-white/10 ${idx % 2 === 0 ? "bg-black/[.01] dark:bg-white/[.02]" : ""} hover:bg-black/[.03] dark:hover:bg-white/[.06] transition-colors`}>
                <td className="py-2 pr-4 whitespace-nowrap">{ts}</td>
                <td className="py-2 pr-4">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorForType(i.type) }} />
                    {i.type}
                  </span>
                </td>
                <td className="py-2 pr-4">{i.address || "—"}</td>
                <td className="py-2">{i.source || "—"}</td>
              </tr>
            );})
          )}
        </tbody>
      </table>
    </div>
  );
}
