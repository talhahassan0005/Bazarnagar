import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/layout/Logo";

/**
 * Seller auth shell — mirrors the admin login design: dark navy backdrop with a
 * warm radial glow, brand lockup on top, and a white card holding the form.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-900 px-4 py-10">
      {/* Blurred shop/marketplace backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center opacity-20 blur-[3px]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop')",
        }}
      />
      {/* Navy wash to keep the dark brand mood and card contrast */}
      <div className="pointer-events-none absolute inset-0 bg-brand-900/70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,93,44,0.18),_transparent_55%)]" />
      <Link
        href="/"
        className="relative mb-6 flex items-center gap-2.5 text-white transition-transform hover:scale-[1.02]"
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
