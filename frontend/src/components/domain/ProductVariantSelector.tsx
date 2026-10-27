"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface VariantOption {
  label: string;
  price: number;
}
interface Variant {
  name: string;
  options: VariantOption[];
}

/**
 * Displays variant groups (Size, Color, etc.) on the product detail page.
 * Auto-selects the cheapest option in each group on mount.
 * Calls `onPriceChange` with the selected price and `onVariantChange` with
 * a summary string (e.g. "Size: M, Color: Red") for the WhatsApp message.
 */
export function ProductVariantSelector({
  variants,
  onPriceChange,
  onVariantChange,
}: {
  variants: Variant[];
  onPriceChange: (price: number) => void;
  onVariantChange?: (label: string) => void;
}) {
  // Initialize with the cheapest option index per group
  const initialSelected: Record<number, number> = {};
  variants.forEach((group, gi) => {
    let minIdx = 0;
    group.options.forEach((opt, oi) => {
      if (opt.price < group.options[minIdx].price) minIdx = oi;
    });
    initialSelected[gi] = minIdx;
  });

  const [selected, setSelected] = useState<Record<number, number>>(initialSelected);

  // Fire callbacks on first render with the cheapest defaults
  useEffect(() => {
    if (!variants || variants.length === 0) return;
    notifyParent(initialSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!variants || variants.length === 0) return null;

  function notifyParent(sel: Record<number, number>) {
    // Price: use the last group's selected option price (or first group if only one)
    const lastGroupIdx = variants.length - 1;
    const lastOptIdx = sel[lastGroupIdx] ?? 0;
    const price = variants[lastGroupIdx]?.options[lastOptIdx]?.price ?? variants[0]?.options[sel[0] ?? 0]?.price;
    if (price !== undefined) onPriceChange(price);

    // Variant label summary for WhatsApp
    const parts = variants.map((group, gi) => {
      const oi = sel[gi] ?? 0;
      return `${group.name}: ${group.options[oi]?.label ?? ""}`;
    });
    onVariantChange?.(parts.join(", "));
  }

  function pick(gi: number, oi: number) {
    const next = { ...selected, [gi]: oi };
    setSelected(next);
    notifyParent(next);
  }

  return (
    <div className="mt-4 space-y-4">
      {variants.map((group, gi) => (
        <div key={gi}>
          <p className="mb-1.5 text-sm font-medium text-slate-700">{group.name}</p>
          <div className="flex flex-wrap gap-2">
            {group.options.map((opt, oi) => {
              const active = selected[gi] === oi;
              return (
                <button
                  key={oi}
                  type="button"
                  onClick={() => pick(gi, oi)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                  }`}
                >
                  {opt.label}
                  <span className={`ml-1.5 text-xs ${active ? "text-brand-600" : "text-slate-500"}`}>
                    {formatPrice(opt.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
