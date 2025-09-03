"use client";

import { useState } from "react";

type Props = {
  initialPostal?: string;
  initialDays?: number;
  initialRadiusKm?: number;
  onSearch: (query: { postal: string; days: number; radiusKm: number; strict: boolean }) => void;
};

export default function SearchForm({
  initialPostal = "",
  initialDays = 90,
  initialRadiusKm = 3,
  onSearch,
}: Props) {
  const [postal, setPostal] = useState(initialPostal);
  const [days, setDays] = useState<number>(initialDays);
  const [radiusKm, setRadiusKm] = useState<number>(initialRadiusKm);
  const [strict, setStrict] = useState<boolean>(false);
  

  return (
    <form
      className="w-full flex flex-col sm:flex-row gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!postal.trim()) return;
        onSearch({ postal: postal.trim(), days, radiusKm, strict });
      }}
    >
      <input
        aria-label="Postal code"
        placeholder="Enter postal code (e.g., L5B 3Y1)"
        className="flex-1 rounded-lg border border-black/10 dark:border-white/20 bg-white/80 dark:bg-black/40 px-3 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        value={postal}
        onChange={(e) => setPostal(e.target.value)}
      />
      <div className="relative">
        <select
          aria-label="Time range"
          className="appearance-none rounded-lg border border-black/10 dark:border-white/20 bg-white/80 dark:bg-black/40 px-3 py-2 pr-8 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
        >
          <option value={90}>Last 3 months</option>
          <option value={180}>Last 6 months</option>
          <option value={365}>Last year</option>
        </select>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
        >
          <path fill="currentColor" d="M5.5 7.5 10 12l4.5-4.5" />
        </svg>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/10 dark:border-white/20 bg-white/80 dark:bg-black/40">
        <label className="text-xs opacity-70 whitespace-nowrap">Radius</label>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={radiusKm}
          onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
        />
        <span className="text-xs tabular-nums w-8">{radiusKm}km</span>
      </div>
      <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/10 dark:border-white/20 bg-white/80 dark:bg-black/40 text-xs cursor-pointer select-none">
        <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} />
        Strict dates only
      </label>
      
      <button type="submit" className="rounded-md bg-foreground text-background px-4 py-2 font-medium">
        Search
      </button>
    </form>
  );
}
