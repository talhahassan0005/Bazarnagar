"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectCartCount } from "@/store/cartSlice";

/** Cart icon with a live item-count badge. */
export function CartLink() {
  const count = useAppSelector(selectCartCount);

  return (
    <Link
      href="/cart"
      aria-label={`Cart${count ? ` (${count} items)` : ""}`}
      className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
