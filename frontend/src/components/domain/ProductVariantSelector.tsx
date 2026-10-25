"use client";

import { useState } from "react";
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
 * Calls `onPriceChange` with the selected option's price so the parent can
 * update the displayed price.
 */
export function ProductVariantSelector({
  variants,
  basePrice,
  onPriceChange,
}: {
  variants: Variant[];
  basePrice: number;
  onPriceChange: (price: number) => void;
}) {
  const [selected, setSelected] = useState<Record<number, number>>({});

  if (!variants || variants.length === 0) return null;

  function pick(gi: number, oi: number, price: number) {
    const next = { ...selected, [gi]: oi };
    setSelected(next);
    // Use the last-picked variant's price, or fall back to base
    onPriceChange(price);
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
                  onClick={() => pick(gi, oi, opt.price)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                  }`}
                >
                  {opt.label}
                  {opt.price !== basePrice && (
                    <span className={`ml-1.5 text-xs ${active ? "text-brand-600" : "text-slate-500"}`}>
                      {formatPrice(opt.price)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
