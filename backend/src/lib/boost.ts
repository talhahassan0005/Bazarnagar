/**
 * Featured-product "boost" packages (SRS §featured). Rates are configurable
 * here in one place; the seller pays to feature a product for a period, after
 * which it ranks first in search and store listings with a "Featured" tag.
 * Mirrors frontend/src/lib/constants.ts BOOST_PACKAGES.
 */
export interface BoostPackage {
  id: string;
  label: string;
  days: number;
  price: number; // PKR
}

export const BOOST_PACKAGES: BoostPackage[] = [
  { id: "boost7", label: "7 days", days: 7, price: 500 },
  { id: "boost15", label: "15 days", days: 15, price: 900 },
  { id: "boost30", label: "30 days", days: 30, price: 1500 },
];

export function getBoostPackage(id: string): BoostPackage | undefined {
  return BOOST_PACKAGES.find((p) => p.id === id);
}
