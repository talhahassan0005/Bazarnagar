import type { ReactNode } from "react";
import Link from "next/link";
import { LogoImage } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-brand-50 via-white to-slate-50 px-4 py-10">
      {/* soft brand glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-accent-200/30 blur-3xl" />
      <Link href="/" className="relative mb-6 transition-transform hover:scale-[1.02]">
        <LogoImage className="h-14 w-auto" priority />
      </Link>
      <div className="relative w-full max-w-md animate-fade-in-up">{children}</div>
    </div>
  );
}
