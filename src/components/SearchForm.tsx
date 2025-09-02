"use client";

import { useState } from "react";

type Props = {
  initialPostal?: string;
  initialDays?: number;
  onSearch: (query: { postal: string; days: number }) => void;
};

export default function SearchForm({ initialPostal = "", initialDays = 7, onSearch }: Props) {
  const [postal, setPostal] = useState(initialPostal);
  const [days, setDays] = useState<number>(initialDays);

  return (
    <form
      className="w-full flex flex-col sm:flex-row gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!postal.trim()) return;
        onSearch({ postal: postal.trim(), days });
      }}
    >
      <input
        aria-label="Postal code"
        placeholder="Enter postal code (e.g., L5B 3Y1)"
        className="flex-1 rounded-md border border-black/10 dark:border-white/20 bg-white/60 dark:bg-black/30 px-3 py-2"
        value={postal}
        onChange={(e) => setPostal(e.target.value)}
      />
      <select
        aria-label="Last N days"
        className="rounded-md border border-black/10 dark:border-white/20 bg-white/60 dark:bg-black/30 px-3 py-2"
        value={days}
        onChange={(e) => setDays(parseInt(e.target.value, 10))}
      >
        <option value={1}>Last 1 day</option>
        <option value={3}>Last 3 days</option>
        <option value={7}>Last 7 days</option>
        <option value={14}>Last 14 days</option>
        <option value={30}>Last 30 days</option>
      </select>
      <button type="submit" className="rounded-md bg-foreground text-background px-4 py-2 font-medium">
        Search
      </button>
    </form>
  );
}
