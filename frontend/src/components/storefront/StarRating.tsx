"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Star rating — display mode (read-only) or interactive when `onChange` is set.
 */
export function StarRating({
  value,
  onChange,
  size = 16,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}) {
  const interactive = typeof onChange === "function";

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const StarIcon = (
          <Star
            style={{ width: size, height: size }}
            className={cn(filled ? "fill-amber-400 text-amber-400" : "text-slate-300")}
          />
        );
        return interactive ? (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange!(star)}
            className="rounded transition-transform hover:scale-110"
          >
            {StarIcon}
          </button>
        ) : (
          <span key={star}>{StarIcon}</span>
        );
      })}
    </div>
  );
}
