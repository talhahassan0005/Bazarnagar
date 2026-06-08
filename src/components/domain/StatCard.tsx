import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Dashboard metric tile (SRS §5.2 / §11). */
export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  tone?: "brand" | "accent" | "gold" | "leaf" | "slate";
}) {
  const toneMap = {
    brand: "bg-brand-50 text-brand-700",
    accent: "bg-accent-50 text-accent-600",
    gold: "bg-gold-500/10 text-gold-600",
    leaf: "bg-leaf-500/10 text-leaf-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        {icon && (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110",
              toneMap[tone]
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/** Plan usage progress bar (products used / limit). */
export function PlanUsageBar({
  used,
  limit,
  className,
}: {
  used: number;
  limit: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const near = pct >= 80;
  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-500">Products used</span>
        <span className="font-medium text-slate-700">
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            near ? "bg-amber-500" : "bg-brand-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
