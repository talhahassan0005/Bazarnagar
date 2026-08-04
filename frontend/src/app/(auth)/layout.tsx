import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/layout/Logo";

/**
 * Seller/buyer auth shell — a deep navy backdrop with layered brand-colored
 * glows and a soft grid, brand lockup on top, and a white card holding the
 * form.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0b1324] px-4 py-10">
      {/* Base grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {/* Layered color glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-600/30 blur-[110px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-24 h-[26rem] w-[26rem] rounded-full bg-accent-500/25 blur-[110px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0b1324]"
      />

      <Link
        href="/"
        className="relative mb-8 flex items-center gap-2.5 text-white transition-transform hover:scale-[1.02]"
      >
        <BrandMark className="h-10 w-10" />
        <span className="text-xl font-bold tracking-tight">
          Bazaar<span className="text-accent-500">nagar</span>
        </span>
      </Link>
      <div className="relative w-full max-w-sm animate-fade-in-up">{children}</div>
    </div>
  );
}
