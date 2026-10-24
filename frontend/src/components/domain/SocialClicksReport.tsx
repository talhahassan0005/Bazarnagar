"use client";

import type { ReactNode } from "react";
import { Card, CardBody, CardHeader, Button, Skeleton } from "@/components/ui";
import { SOCIALS, type SocialPlatform } from "@/lib/socials";
import { cn, formatCount } from "@/lib/utils";
import type { SocialClickPeriod, SocialClickReport } from "@/lib/types";

export const PERIODS: { value: SocialClickPeriod; label: string }[] = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "all", label: "All time" },
];

export function PeriodPicker({ value, onChange }: { value: SocialClickPeriod; onChange: (p: SocialClickPeriod) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PERIODS.map((p) => (
        <Button key={p.value} size="sm" variant={value === p.value ? "primary" : "outline"} onClick={() => onChange(p.value)}>
          {p.label}
        </Button>
      ))}
    </div>
  );
}

const formatDay = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

/**
 * Social link taps per platform and per day. Shows the platforms the store
 * has (`platforms`) plus any that still have clicks from before.
 */
export function SocialClicksReport({
  data,
  isLoading,
  platforms,
  period,
  onPeriod,
  title = "Social link clicks",
  action,
}: {
  data?: SocialClickReport;
  isLoading: boolean;
  platforms: SocialPlatform[];
  period: SocialClickPeriod;
  onPeriod: (p: SocialClickPeriod) => void;
  title?: string;
  action?: ReactNode;
}) {
  const shown = SOCIALS.filter((s) => platforms.includes(s.key) || (data?.totals[s.key] ?? 0) > 0);

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle="Taps on the social icons on the shop page, by day (Pakistan time)."
        action={action}
      />
      <CardBody className="space-y-4">
        <PeriodPicker value={period} onChange={onPeriod} />

        {isLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : shown.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No social links added yet. Add them in Store Profile to show icons on the shop.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {shown.map(({ key, label, icon: Icon, className }) => (
                <div key={key} className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5">
                  <Icon className={cn("h-5 w-5 shrink-0", className)} />
                  <div className="min-w-0">
                    <p className="truncate text-xs text-slate-500">{label}</p>
                    <p className="text-lg font-semibold text-slate-900">{formatCount(data?.totals[key] ?? 0)}</p>
                  </div>
                </div>
              ))}
            </div>

            {!data || data.days.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No clicks in this period yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      {shown.map(({ key, label, icon: Icon, className }) => (
                        <th key={key} className="px-3 py-2 text-center font-medium" title={label}>
                          <Icon className={cn("mx-auto h-4 w-4", className)} aria-label={label} />
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.days.map((d) => (
                      <tr key={d.date}>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">{formatDay(d.date)}</td>
                        {shown.map(({ key }) => (
                          <td key={key} className={cn("px-3 py-2 text-center", d.counts[key] ? "text-slate-800" : "text-slate-300")}>
                            {d.counts[key] ?? 0}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">{d.total}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-semibold text-slate-900">
                    <tr>
                      <td className="px-3 py-2">Total</td>
                      {shown.map(({ key }) => (
                        <td key={key} className="px-3 py-2 text-center">{data.totals[key] ?? 0}</td>
                      ))}
                      <td className="px-3 py-2 text-right">{data.total}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
