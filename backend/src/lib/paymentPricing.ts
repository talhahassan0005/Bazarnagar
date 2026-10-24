import { Settings } from "../models/Settings";
import { PlanConfig } from "../models/PlanConfig";
import type { PlanId } from "../models/Seller";
import { ApiError } from "./helpers";
import { getPlan } from "./plans";

/** Sellers in Pakistan pay in PKR (no tax); everyone else pays the plan's USD price plus the admin's tax. */
export type PaymentCurrency = "PKR" | "USD";
export const PAYMENT_CURRENCIES = ["PKR", "USD"] as const;

export interface PaymentConfig {
  /** Tax added on top of USD plan prices, in percent (0 = none). */
  usdTaxPercent: number;
  /** Fee added when paying online by card (Stripe), in percent of price + tax (0 = none). */
  cardFeePercent: number;
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const s = await Settings.findOne({ key: "payment" }).lean();
  return { usdTaxPercent: s?.usdTaxPercent ?? 0, cardFeePercent: s?.cardFeePercent ?? 0 };
}

/** Online card payment (adds the card fee) or manual bank / JazzCash / EasyPaisa (no fee). */
export type PaymentMethodKind = "card" | "manual";

export interface PlanQuote {
  currency: PaymentCurrency;
  /** Plan price before tax. */
  base: number;
  taxPercent: number;
  tax: number;
  cardFeePercent: number;
  cardFee: number;
  /** What the seller pays. */
  total: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The amount to charge for one month of a plan: the admin-set price in the
 * chosen currency, plus tax for USD (other countries), plus the card fee when
 * paying online by card.
 */
export async function quotePlan(
  planId: PlanId,
  currency: PaymentCurrency,
  method: PaymentMethodKind = "manual"
): Promise<PlanQuote> {
  const o = await PlanConfig.findOne({ planId }).select("price priceUsd").lean();
  const config = await getPaymentConfig();
  let base: number;
  let taxPercent = 0;
  if (currency === "PKR") {
    base = o?.price ?? getPlan(planId).price;
  } else {
    base = o?.priceUsd ?? 0;
    if (!base) throw new ApiError(400, "This plan doesn't have a USD price yet. Please choose Pakistan (PKR) or contact us.");
    taxPercent = config.usdTaxPercent;
  }
  // Whole rupees for PKR; cents for USD.
  const round = currency === "PKR" ? Math.round : round2;
  const tax = round((base * taxPercent) / 100);
  const cardFeePercent = method === "card" ? config.cardFeePercent : 0;
  const cardFee = round(((base + tax) * cardFeePercent) / 100);
  return { currency, base, taxPercent, tax, cardFeePercent, cardFee, total: round(base + tax + cardFee) };
}
