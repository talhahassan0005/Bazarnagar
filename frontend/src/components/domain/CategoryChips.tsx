"use client";

import { cn } from "@/lib/utils";

/** Horizontal scrollable category filter (used on shop & search pages). */
export function CategoryChips({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value: string;
  onChange: (category: string) => void;
}) {
  const all = ["", ...categories];
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {all.map((c) => (
        <button
          key={c || "all"}
          onClick={() => onChange(c)}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
            value === c
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          )}
        >
          {c || "All"}
        </button>
      ))}
    </div>
  );
}
