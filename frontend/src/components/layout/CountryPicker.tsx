"use client";

import { Globe } from "lucide-react";
import { useCountry } from "@/lib/useCountry";
import { COUNTRY_OPTIONS } from "@/lib/countries";

export function CountryPicker() {
  const { country, setCountry } = useCountry();

  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-900">
        Shopping in
      </p>
      <div className="relative inline-flex items-center">
        <Globe className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="appearance-none rounded-lg border border-slate-200 bg-white pl-8 pr-6 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          {COUNTRY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
