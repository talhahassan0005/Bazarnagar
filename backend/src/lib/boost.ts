import { BoostConfig } from "../models/BoostConfig";

/**
 * Featured-product "boost" packages (SRS §featured). These are the default
 * rates — an admin can override price/label/days/enabled per package via
 * BoostConfig (see `getEffectiveBoostPackages`); the seller pays to feature a
 * product for a period, after which it ranks first in search and store
 * listings with a "Featured" tag.
 */
export interface BoostPackage {
  id: string;
  label: string;
  days: number;
  price: number; // PKR
  enabled?: boolean;
}

export const BOOST_PACKAGES: BoostPackage[] = [
  { id: "boost7", label: "7 days", days: 7, price: 500 },
  { id: "boost15", label: "15 days", days: 15, price: 900 },
  { id: "boost30", label: "30 days", days: 30, price: 1500 },
];

/** Default packages merged with any admin-set overrides (price/label/days/enabled). */
export async function getEffectiveBoostPackages(): Promise<BoostPackage[]> {
  const saved = await BoostConfig.find();
  const savedById = new Map(saved.map((p) => [p.packageId, p]));
  return BOOST_PACKAGES.map((pkg) => {
    const override = savedById.get(pkg.id);
    return override
      ? { id: pkg.id, label: override.label, days: override.days, price: override.price, enabled: override.enabled }
      : { ...pkg, enabled: true };
  });
}

/** One package's live (override-aware) config, or undefined if unknown/disabled. */
export async function getEffectiveBoostPackage(id: string): Promise<BoostPackage | undefined> {
  const packages = await getEffectiveBoostPackages();
  return packages.find((p) => p.id === id && p.enabled !== false);
}
