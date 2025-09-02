"use client";

import { useMemo, useState } from "react";
import SearchForm from "@/components/SearchForm";
import MapView from "@/components/MapView";
import IncidentsTable from "@/components/IncidentsTable";

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
  const [center, setCenter] = useState<[number, number]>([43.589, -79.644]); // Mississauga City Centre
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [days, setDays] = useState<number>(7);

  const markers = useMemo(
    () =>
      incidents
        .filter((i) => i.lat && i.lng)
        .map((i) => ({ id: i.id, lat: i.lat!, lng: i.lng!, label: i.type })),
    [incidents]
  );

  const onSearch = async ({ postal, days }: { postal: string; days: number }) => {
    setDays(days);
    setLoading(true);
    try {
      const geo = await fetch(`/api/geocode?postal=${encodeURIComponent(postal)}`, { cache: "no-store" }).then((r) =>
        r.json()
      );
      if (geo?.lat && geo?.lng) {
        setCenter([geo.lat, geo.lng]);
        const res = await fetch(
          `/api/incidents?lat=${geo.lat}&lng=${geo.lng}&radiusKm=2&days=${days}`,
          { cache: "no-store" }
        ).then((r) => r.json());
        setIncidents(res.incidents || []);
      } else {
        setIncidents([]);
      }
    } catch (e) {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 sm:p-10 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Neighborhood Safety Dashboard</h1>
        <p className="text-sm opacity-80">Enter a postal code and select a time range.</p>
        <SearchForm onSearch={onSearch} initialDays={days} />
      </header>

      <section className="grid grid-cols-1 gap-6">
        <MapView center={center} markers={markers} />
        <IncidentsTable data={incidents} loading={loading} />
      </section>
    </div>
  );
}
