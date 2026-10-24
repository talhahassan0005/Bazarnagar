"use client";

import { Select } from "@/components/ui";
import { useGetPlanPaymentConfigQuery } from "@/store/apiSlice";
import { formatMoney } from "@/lib/utils";
import type { PaymentCurrency, Plan, PlanPaymentConfig } from "@/lib/types";

/** Sellers in Pakistan default to PKR; anyone else to USD. */
export const defaultCurrency = (country?: string): PaymentCurrency =>
  !country || country === "Pakistan" ? "PKR" : "USD";

export interface PlanQuote {
  currency: PaymentCurrency;
  base: number;
  taxPercent: number;
  tax: number;
  cardFeePercent: number;
  cardFee: number;
  total: number;
  /** False when the plan has no USD price set. */
  available: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Mirrors the backend's quotePlan: PKR has no tax, USD adds the admin's tax %,
 * and paying online by card adds the card fee on top.
 */
export function quoteFor(
  plan: Plan,
  currency: PaymentCurrency,
  config: PlanPaymentConfig,
  method: "card" | "manual" = "manual"
): PlanQuote {
  const base = currency === "PKR" ? plan.price : plan.priceUsd ?? 0;
  const taxPercent = currency === "USD" ? config.usdTaxPercent : 0;
  // Whole rupees for PKR; cents for USD (same as the backend).
  const round = currency === "PKR" ? Math.round : round2;
  const tax = round((base * taxPercent) / 100);
  const cardFeePercent = method === "card" ? config.cardFeePercent : 0;
  const cardFee = round(((base + tax) * cardFeePercent) / 100);
  return {
    currency,
    base,
    taxPercent,
    tax,
    cardFeePercent,
    cardFee,
    total: round(base + tax + cardFee),
    available: base > 0 || currency === "PKR",
  };
}

const NO_FEES: PlanPaymentConfig = { usdTaxPercent: 0, cardFeePercent: 0 };

/** The live USD tax % and card fee %, defaulting to 0 while they load. */
export function usePlanPaymentConfig(): PlanPaymentConfig {
  return useGetPlanPaymentConfigQuery().data ?? NO_FEES;
}

/**
 * "Where are you paying from?" — Pakistan pays the PKR price with no tax,
 * other countries pay the USD price plus the admin-set tax. Shows the total.
 */
export function PaymentCurrencySelect({
  plan,
  currency,
  onChange,
}: {
  plan: Plan;
  currency: PaymentCurrency;
  onChange: (c: PaymentCurrency) => void;
}) {
  const config = usePlanPaymentConfig();
  const taxPercent = config.usdTaxPercent;
  const q = quoteFor(plan, currency, config);
  const usdAvailable = (plan.priceUsd ?? 0) > 0;

  return (
    <div className="space-y-2">
      <Select
        label="Paying from"
        value={currency}
        onChange={(e) => onChange(e.target.value as PaymentCurrency)}
        options={[
          { value: "PKR", label: "Pakistan — pay in PKR (no tax)" },
          {
            value: "USD",
            label: usdAvailable
              ? `Other country — pay in USD${taxPercent ? ` (+${taxPercent}% tax)` : ""}`
              : "Other country — USD (not available for this plan)",
          },
        ]}
      />
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
        {!q.available ? (
          <p className="text-amber-700">
            This plan doesn&apos;t have a USD price yet. Please pay in PKR, or contact us.
          </p>
        ) : (
          <>
            <div className="flex justify-between text-slate-600">
              <span>{plan.name} — 1 month</span>
              <span>{formatMoney(q.base, q.currency)}</span>
            </div>
            {q.currency === "USD" && q.taxPercent > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax ({q.taxPercent}%)</span>
                <span>{formatMoney(q.tax, q.currency)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
              <span>Total{config.cardFeePercent > 0 ? " (manual payment)" : ""}</span>
              <span>{formatMoney(q.total, q.currency)}</span>
            </div>
            {config.cardFeePercent > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Paying online by card adds a {config.cardFeePercent}% card fee:{" "}
                <strong>{formatMoney(quoteFor(plan, currency, config, "card").total, q.currency)}</strong>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
