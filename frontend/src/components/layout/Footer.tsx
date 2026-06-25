import Link from "next/link";
import { BrandMark } from "./Logo";
import { SITE_NAME, SITE_TAGLINE, SITE_TAGLINE_UR } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight text-brand-700">
              Bazaar<span className="text-accent-500">nagar</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-500">{SITE_TAGLINE}</p>
          <p dir="rtl" className="mt-1 text-sm text-accent-500">
            {SITE_TAGLINE_UR}
          </p>
        </div>
        <div className="flex gap-12 text-sm">
          <div>
            <p className="mb-2 font-semibold text-slate-900">Platform</p>
            <ul className="space-y-2 text-slate-500">
              <li><Link href="/search" className="transition-colors hover:text-brand-700">Browse products</Link></li>
              <li><Link href="/signup" className="transition-colors hover:text-brand-700">Become a seller</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-brand-700">Seller login</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold text-slate-900">Company</p>
            <ul className="space-y-2 text-slate-500">
              <li><Link href="/" className="transition-colors hover:text-brand-700">About</Link></li>
              <li><Link href="/" className="transition-colors hover:text-brand-700">Contact</Link></li>
              <li><Link href="/admin" className="transition-colors hover:text-brand-700">Admin</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © 2026 {SITE_NAME} · Prototype 1
      </div>
    </footer>
  );
}
