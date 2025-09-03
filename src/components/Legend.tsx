"use client";

import { colorForType, normalizeType } from "@/lib/colors";

export default function Legend({ types }: { types: string[] }) {
  const uniq = Array.from(new Set(types.map((t) => normalizeType(t))));
  if (uniq.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {uniq.map((t) => (
        <span key={t} className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/10">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colorForType(t) }}
          />
          {t}
        </span>
      ))}
    </div>
  );
}
