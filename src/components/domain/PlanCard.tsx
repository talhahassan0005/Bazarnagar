import { Check } from "lucide-react";
import { Button } from "@/components/ui";
import { cn, formatPrice } from "@/lib/utils";
import type { Plan } from "@/lib/types";

/** Plan tile used on the landing page and the seller plan page. */
export function PlanCard({
  plan,
  current,
  onSelect,
}: {
  plan: Plan;
  current?: boolean;
  onSelect?: (plan: Plan) => void;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm",
        current ? "border-brand-400 ring-1 ring-brand-200" : "border-slate-200"
      )}
    >
      {current && (
        <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-medium text-white">
          Current plan
        </span>
      )}
      <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
      <p className="mt-2">
        <span className="text-3xl font-bold text-slate-900">{formatPrice(plan.price)}</span>
        <span className="text-sm text-slate-400">/mo</span>
      </p>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
        {plan.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            {h}
          </li>
        ))}
      </ul>
      <Button
        variant={current ? "outline" : "primary"}
        fullWidth
        className="mt-6"
        disabled={current}
        onClick={() => onSelect?.(plan)}
      >
        {current ? "Active" : `Switch to ${plan.name}`}
      </Button>
    </div>
  );
}
