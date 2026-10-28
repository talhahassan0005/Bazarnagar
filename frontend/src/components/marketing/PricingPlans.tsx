"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { PaymentHelpLink } from "@/components/domain/PaymentHelpLink";
import { usePlanPaymentConfig } from "@/components/domain/PaymentCurrencySelect";
import { useGetPublicPlanConfigQuery } from "@/store/apiSlice";
import { useAppSelector } from "@/store/hooks";
import { PLAN_LIST } from "@/lib/constants";
import { cn, formatPrice, formatUsd } from "@/lib/utils";
import type { Plan } from "@/lib/types";

type Currency = "PKR" | "USD";

const UNLIMITED = 1_000_000;

/** Limits come from the plan itself, so they always match what sellers get. */
function limitFeatures(plan: Plan): string[] {
  const out = [
    plan.productLimit >= UNLIMITED ? "Unlimited products" : `Up to ${plan.productLimit.toLocaleString("en-PK")} products`,
    `Up to ${plan.imageLimit} photos per product`,
  ];
  if (plan.videoLimit > 0) out.push(`${plan.videoLimit} video${plan.videoLimit > 1 ? "s" : ""} per product`);
  return out;
}

function PlanCard({ plan, currency, ctaHref, usdTaxPercent }: { plan: Plan; currency: Currency; ctaHref: string; usdTaxPercent: number }) {
  const dark = plan.highlighted;
  const free = plan.price === 0;
  const usd = currency === "USD";
  const noUsd = usd && !free && !plan.priceUsd;
  const amount = usd && !noUsd ? formatUsd(free ? 0 : plan.priceUsd!) : formatPrice(plan.price);
  const features = [...limitFeatures(plan), ...(plan.features ?? [])];

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl p-7 sm:p-8",
        dark
          ? "bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 text-white shadow-2xl shadow-brand-900/25 lg:-my-3"
          : "border border-slate-200 bg-white shadow-xl shadow-slate-200/60"
      )}
    >
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
          dark ? "border border-white/25 bg-white/10 text-white" : "border border-leaf-500/20 bg-leaf-500/5 text-leaf-600"
        )}
      >
        {dark && <Star className="h-3 w-3 fill-current" />}
        {plan.name}
        {plan.tagline && <span className="opacity-80">· {plan.tagline}</span>}
        {dark && <span className="opacity-80">· Recommended</span>}
      </span>

      <div className="mt-5 flex items-baseline gap-2">
        <span className={cn("text-4xl font-bold tracking-tight sm:text-5xl", dark ? "text-white" : "text-brand-900")}>
          {amount}
        </span>
        <span className={cn("text-sm", dark ? "text-white/70" : "text-slate-500")}>{free ? "/ forever" : "/ mo"}</span>
      </div>
      {!free && !usd && (
        <p className={cn("mt-1.5 text-xs font-medium", dark ? "text-white/75" : "text-slate-500")}>
          Just {formatPrice(Math.ceil(plan.price / 30))}/day
        </p>
      )}
      {usd && !free && !noUsd && usdTaxPercent > 0 && (
        <p className={cn("mt-1.5 text-xs font-medium", dark ? "text-white/75" : "text-slate-500")}>
          + {usdTaxPercent}% tax for payments from outside Pakistan
        </p>
      )}
      {noUsd && (
        <p className={cn("mt-1.5 text-xs font-medium", dark ? "text-white/75" : "text-slate-500")}>
          Dollar price not available — billed in PKR.
        </p>
      )}

      {plan.description && (
        <p className={cn("mt-4 text-sm leading-relaxed", dark ? "text-white/90" : "text-slate-600")}>{plan.description}</p>
      )}

      <ul className="mt-6 flex-1 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                dark ? "bg-white/20 text-white" : "bg-leaf-500/10 text-leaf-600"
              )}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className={dark ? "text-white" : "text-slate-700"}>{f}</span>
          </li>
        ))}
      </ul>

      <Button
        href={ctaHref}
        size="lg"
        className={cn(
          "mt-8 w-full",
          dark && "bg-white text-brand-800 hover:bg-white/90"
        )}
      >
        {free ? "Launch your free store" : `Get ${plan.name}`}
      </Button>
    </div>
  );
}

/** Pricing cards from the live, admin-editable plan settings. */
export function PricingPlans({ serverPlans }: { serverPlans?: Plan[] }) {
  const { data, isLoading } = useGetPublicPlanConfigQuery(undefined, { skip: !!serverPlans });
  const role = useAppSelector((s) => s.auth.role);
  const [currency, setCurrency] = useState<Currency>("PKR");
  const { usdTaxPercent } = usePlanPaymentConfig();

  // Server-fetched plans take priority; otherwise use RTK Query (dashboard etc.)
  const plans = (serverPlans ?? data ?? (isLoading ? [] : PLAN_LIST)).filter((p) => p.enabled ?? true);
  const hasUsd = plans.some((p) => p.price > 0 && (p.priceUsd ?? 0) > 0);
  const ctaHref = role === "seller" ? "/dashboard/plan" : "/signup?role=seller";

  const cols =
    plans.length >= 4 ? "md:grid-cols-2 xl:grid-cols-4" : plans.length === 3 ? "md:grid-cols-3" : plans.length === 2 ? "md:grid-cols-2" : "";

  return (
    <div>
      {hasUsd && (
        <div className="mb-10 flex justify-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Currency">
            {(["PKR", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
                className={cn(
                  "rounded-full px-5 py-1.5 text-sm font-semibold transition-colors",
                  currency === c ? "bg-brand-700 text-white" : "text-slate-600 hover:text-brand-700"
                )}
              >
                {c === "PKR" ? "Rs PKR" : "$ USD"}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <Skeleton className="h-[520px] rounded-3xl" />
          <Skeleton className="h-[520px] rounded-3xl" />
        </div>
      ) : (
        <div className={cn("mx-auto grid items-stretch gap-6", cols, plans.length <= 2 ? "max-w-5xl" : "max-w-7xl")}>
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} currency={currency} ctaHref={ctaHref} usdTaxPercent={usdTaxPercent} />
          ))}
        </div>
      )}

      <PaymentHelpLink className="mt-10" />
    </div>
  );
}
