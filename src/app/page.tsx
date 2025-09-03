"use client";

import { useMemo, useState } from "react";
import SearchForm from "@/components/SearchForm";
import MapView from "@/components/MapView";
import IncidentsTable from "@/components/IncidentsTable";
import Legend from "@/components/Legend";
import { colorForType } from "@/lib/colors";

type Incident = {
  id: string;
  type: string;
  timestamp: string;
  address?: string;
  lat?: number;
  lng?: number;
  source?: string;
};

export default function Home() {
  const [center, setCenter] = useState<[number, number]>([43.6532, -79.3832]); // Toronto City Hall area
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [days, setDays] = useState<number>(90);
  const [areaLabel, setAreaLabel] = useState<string>("");
  const [radiusKm, setRadiusKm] = useState<number>(3);

  const markers = useMemo(
    () =>
      incidents
        .filter((i) => i.lat && i.lng)
        .map((i) => ({
          id: i.id,
          lat: i.lat!,
          lng: i.lng!,
          label: `${i.type}${i.address ? `, ${i.address}` : ""}`,
          color: colorForType(i.type),
        })),
    [incidents]
  );

  const onSearch = async ({ postal, days, radiusKm }: { postal: string; days: number; radiusKm: number }) => {
    setDays(days);
    setRadiusKm(radiusKm);
    setLoading(true);
    try {
      const geo = await fetch(`/api/geocode?postal=${encodeURIComponent(postal)}`, { cache: "no-store" }).then((r) =>
        r.json()
      );
      if (geo?.lat && geo?.lng) {
        setCenter([geo.lat, geo.lng]);
        setAreaLabel(geo?.raw?.display_name || "");
        const res = await fetch(
          `/api/incidents?lat=${geo.lat}&lng=${geo.lng}&radiusKm=${radiusKm}&days=${days}`,
          { cache: "no-store" }
        ).then((r) => r.json());
        setIncidents(res.incidents || []);
        if (res.notice) {
          // @ts-ignore - stash on window for quick visibility, and show below title
          (window as any).__INCIDENTS_NOTICE__ = res.notice;
          setNotice(res.notice);
        } else {
          setNotice("");
        }
      } else {
        setIncidents([]);
      }
    } catch (e) {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const [notice, setNotice] = useState<string>("");

  return (
    <div className="min-h-screen p-6 sm:p-10 flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Toronto Neighbourhood Safety Dashboard</h1>
        <p className="text-sm opacity-75">City of Toronto crime incidents (Toronto Police Service Major Crime Indicators). Enter a postal code and select a time range.</p>
        <div className="bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/15 rounded-xl p-3 shadow-sm">
          <SearchForm
            onSearch={onSearch}
            initialDays={days}
            initialRadiusKm={radiusKm}
          />
        </div>
        {notice ? (
          <div className="text-xs rounded-md px-3 py-2 bg-yellow-100/70 text-yellow-900 border border-yellow-200/70">
            {notice}
          </div>
        ) : null}
        {areaLabel ? (
          <div className="text-xs opacity-70">Centered on: {areaLabel}</div>
        ) : null}
      </header>

      <section className="grid grid-cols-1 gap-6">
        <div className="bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/15 rounded-xl p-2 shadow-sm">
          <MapView center={center} markers={markers} />
        </div>
        <div className="bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/15 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Incidents</h2>
            <span className="text-xs opacity-70">{loading ? "Loading…" : `${incidents.length} result(s)`}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/10">
              {days === 90 ? "Last 3 months" : days === 180 ? "Last 6 months" : days === 365 ? "Last year" : `${days} day(s)`}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/10">
              {radiusKm} km
            </span>
          </div>
          <div className="mb-3">
            <Legend types={incidents.map((i) => i.type)} />
          </div>
          <IncidentsTable data={incidents} loading={loading} />
        </div>
      </section>
    </div>
  );
}
