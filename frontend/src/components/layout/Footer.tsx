import Link from "next/link";
import { Mail } from "lucide-react";
import { BrandMark } from "./Logo";
import { SITE_EMAIL, SITE_NAME, SITE_TAGLINE, SITE_TAGLINE_UR } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-8 w-8" />
              <span className="text-lg font-bold tracking-tight text-brand-700">
                Bazaar<span className="text-accent-500">nagar</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">{SITE_TAGLINE}</p>
            <p dir="rtl" className="mt-1 text-sm text-accent-500">{SITE_TAGLINE_UR}</p>
            <a
              href={`mailto:${SITE_EMAIL}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
            >
              <Mail className="h-3.5 w-3.5" />
              {SITE_EMAIL}
            </a>
          </div>

          {/* Platform */}
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-900">Platform</p>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><Link href="/search" className="transition-colors hover:text-brand-700">Browse products</Link></li>
              <li><Link href="/shops" className="transition-colors hover:text-brand-700">Browse shops</Link></li>
              <li><Link href="/orders" className="transition-colors hover:text-brand-700">Track my orders</Link></li>
              <li><Link href="/signup" className="transition-colors hover:text-brand-700">Become a seller</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-brand-700">Seller login</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-900">Company</p>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><Link href="/about" className="transition-colors hover:text-brand-700">About us</Link></li>
              <li><Link href="/how-it-works" className="transition-colors hover:text-brand-700">How it works</Link></li>
              <li>
                <a href={`mailto:${SITE_EMAIL}`} className="transition-colors hover:text-brand-700">
                  Contact us
                </a>
              </li>
              <li><Link href="/admin" className="transition-colors hover:text-brand-700">Admin</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-900">Legal</p>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><Link href="/terms" className="transition-colors hover:text-brand-700">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy" className="transition-colors hover:text-brand-700">Privacy Policy</Link></li>
            </ul>
          </div>

        </div>
      </div>

      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {SITE_NAME} · All rights reserved
      </div>
    </footer>
  );
}
