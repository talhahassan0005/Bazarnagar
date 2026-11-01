"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { DEFAULT_COUNTRY } from "@/lib/countries";

const LS_KEY = "bazarnagar_country";

function readLS(): string {
  try { return localStorage.getItem(LS_KEY) || DEFAULT_COUNTRY; } catch { return DEFAULT_COUNTRY; }
}

/** Returns the active country for product/store filtering.
 *  Priority: logged-in buyer's country > localStorage > Pakistan (default).
 */
export function useCountry(): { country: string; setCountry: (c: string) => void } {
  const customer = useAppSelector((s) => s.auth.customer);
  const [lsCountry, setLsCountry] = useState<string>(DEFAULT_COUNTRY);

  useEffect(() => {
    setLsCountry(readLS());
    function onStorage(e: StorageEvent) {
      if (e.key === LS_KEY) setLsCountry(e.newValue || DEFAULT_COUNTRY);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const country = customer?.country || lsCountry;

  const setCountry = useCallback((c: string) => {
    try { localStorage.setItem(LS_KEY, c); } catch { /* ignore */ }
    setLsCountry(c);
    window.dispatchEvent(new StorageEvent("storage", { key: LS_KEY, newValue: c }));
  }, []);

  return { country, setCountry };
}
