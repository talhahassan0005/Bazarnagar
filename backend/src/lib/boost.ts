import { BoostPricing } from "../models/BoostPricing";

/**
 * Featured-product "boost": any seller (free plan included) pays per day to
 * feature a product, which then ranks first in search and store listings
 * with a "Featured" tag. The admin can change the rate and the allowed range.
 */
export interface BoostPricingConfig {
  pricePerDay: number; // PKR
  minDays: number;
  maxDays: number;
}

export const DEFAULT_BOOST_PRICING: BoostPricingConfig = { pricePerDay: 100, minDays: 1, maxDays: 30 };

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Live pricing — the admin's saved values, else the defaults. */
export async function getBoostPricing(): Promise<BoostPricingConfig> {
  const saved = await BoostPricing.findOne({ key: "boost" });
  return saved
    ? { pricePerDay: saved.pricePerDay, minDays: saved.minDays, maxDays: saved.maxDays }
    : { ...DEFAULT_BOOST_PRICING };
}
