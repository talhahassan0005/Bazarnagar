"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Globe, MapPin } from "lucide-react";
import { useCountry } from "@/lib/useCountry";
import { useAppSelector } from "@/store/hooks";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { BrandMark } from "@/components/layout/Logo";
import { Button } from "@/components/ui";

const LS_KEY = "bazarnagar_country";

function hasStoredCountry(): boolean {
  try { return !!localStorage.getItem(LS_KEY); } catch { return false; }
}

export function CountrySelectPopup() {
  const { setCountry } = useCountry();
  const customer = useAppSelector((s) => s.auth.customer);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Pakistan");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Don't show for logged-in users (they have a registered country)
    if (customer) return;
    // Don't show if country already saved in localStorage
    if (hasStoredCountry()) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [customer]);

  function confirm() {
    setCountry(selected);
    setOpen(false);
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Top accent strip using brand tile colors */}
        <div className="flex h-1.5">
          <div className="flex-1" style={{ background: "#1b3a5b" }} />
          <div className="flex-1" style={{ background: "#e85d2c" }} />
          <div className="flex-1" style={{ background: "#f5a623" }} />
          <div className="flex-1" style={{ background: "#1f6b2e" }} />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <BrandMark className="h-9 w-9 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Welcome to Bazarnagar</h2>
              <p className="text-xs text-slate-500">Select your country to see local shops</p>
            </div>
          </div>

          {/* Country selector */}
          <div className="mt-5">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              <MapPin className="mr-1 inline h-3.5 w-3.5 text-brand-600" />
              Your country
            </label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {COUNTRY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                // Keep Pakistan default, just dismiss
                setCountry("Pakistan");
                setOpen(false);
              }}
            >
              Skip
            </Button>
            <Button className="flex-1" onClick={confirm}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
