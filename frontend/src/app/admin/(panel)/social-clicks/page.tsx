"use client";

import { useState } from "react";
import { CalendarDays, ExternalLink, X } from "lucide-react";
import { Button, TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { LoadError } from "@/components/domain/LoadError";
import { PeriodPicker, SocialClicksReport } from "@/components/domain/SocialClicksReport";
import { useGetAdminSocialClicksQuery, useGetStoreSocialClicksQuery } from "@/store/apiSlice";
import { SOCIALS } from "@/lib/socials";
import { cn, formatCount } from "@/lib/utils";
import type { AdminSocialClickRow, SocialClickPeriod } from "@/lib/types";

const when = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" }) : "—";

/** One store's clicks by day, shown above the list when a row is opened. */
function StoreDetail({ row, onClose }: { row: AdminSocialClickRow; onClose: () => void }) {
  const [period, setPeriod] = useState<SocialClickPeriod>("30");
  const { data, isLoading, isFetching } = useGetStoreSocialClicksQuery(
    { storeId: row.storeId, days: period },
    { refetchOnMountOrArgChange: true }
  );
  return (
    <div className="mb-6">
      <SocialClicksReport
        title={`${row.storeName} — ${row.sellerName}`}
        data={data}
        isLoading={isLoading || isFetching}
        platforms={row.platforms}
        period={period}
        onPeriod={setPeriod}
        action={
          <Button size="sm" variant="ghost" leftIcon={<X className="h-4 w-4" />} onClick={onClose}>
            Close
          </Button>
        }
      />
    </div>
  );
}

export default function AdminSocialClicksPage() {
  const [period, setPeriod] = useState<SocialClickPeriod>("30");
  const [selected, setSelected] = useState<AdminSocialClickRow | null>(null);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminSocialClicksQuery(period, {
    refetchOnMountOrArgChange: true,
  });

  const columns: Column<AdminSocialClickRow>[] = [
    {
      header: "Store",
      cell: (r) => (
        <div>
          <p className="font-medium text-slate-800">{r.storeName}</p>
          <p className="text-xs text-slate-400">
            {r.sellerName} · {r.sellerEmail}
          </p>
        </div>
      ),
    },
    {
      header: "Clicks per link",
      cell: (r) => {
        const shown = SOCIALS.filter((s) => r.platforms.includes(s.key) || (r.totals[s.key] ?? 0) > 0);
        return (
          <div className="flex flex-wrap gap-1.5">
            {shown.map(({ key, label, icon: Icon, className }) => (
              <span
                key={key}
                title={label}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-700"
              >
                <Icon className={cn("h-3.5 w-3.5", className)} />
                {formatCount(r.totals[key] ?? 0)}
              </span>
            ))}
          </div>
        );
      },
    },
    { header: "Total", cell: (r) => <span className="font-semibold">{formatCount(r.total)}</span> },
    { header: "Last click", hideOnMobile: true, cell: (r) => when(r.lastClickAt) },
    {
      header: "Action",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<CalendarDays className="h-4 w-4" />}
            onClick={() => {
              setSelected(r);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            By date
          </Button>
          <Button
            href={`/store/${r.storeSlug}`}
            target="_blank"
            variant="ghost"
            size="sm"
            leftIcon={<ExternalLink className="h-4 w-4" />}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Social Clicks"
        description="How often shoppers tap each seller's website and social links. Open a store to see clicks by date."
      />

      {selected && <StoreDetail key={selected.storeId} row={selected} onClose={() => setSelected(null)} />}

      <div className="mb-4">
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      {isError ? (
        <LoadError what="social clicks" error={error} onRetry={refetch} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : (
        <div className={cn(isFetching && "opacity-60 transition-opacity")}>
          <DataTable
            columns={columns}
            rows={data ?? []}
            empty={<p className="py-10 text-center text-sm text-slate-400">No store has social links yet.</p>}
          />
        </div>
      )}
    </>
  );
}
