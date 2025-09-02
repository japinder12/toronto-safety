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

export default function IncidentsTable({ data, loading }: { data: Incident[]; loading?: boolean }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b border-black/10 dark:border-white/20">
            <th className="py-2 pr-4">Time</th>
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
            data.map((i) => {
              const t = new Date(i.timestamp);
              const ts = isNaN(t.getTime()) ? "Unknown" : t.toLocaleString();
              return (
              <tr key={i.id} className="border-b border-black/5 dark:border-white/10">
                <td className="py-2 pr-4 whitespace-nowrap">{ts}</td>
                <td className="py-2 pr-4">{i.type}</td>
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
