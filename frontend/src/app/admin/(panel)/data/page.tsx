"use client";

import { CalendarPlus, DoorOpen, Package, PackageX, Rocket, Store as StoreIcon } from "lucide-react";
import { Card, CardBody, CardHeader, StatCardSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/domain/StatCard";
import { useGetDataSummaryQuery } from "@/store/apiSlice";
import { formatCount } from "@/lib/utils";
import type { CountRow } from "@/lib/types";

/** Readable labels for status-style keys coming from the API. */
const LABELS: Record<string, string> = {
  in_stock: "In stock",
  out_of_stock: "Out of stock",
  needs_edit: "Needs edit",
};

function label(key: string) {
  return LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

/** A card listing counts per group with a proportional bar. */
function Breakdown({ title, rows, limit = 10 }: { title: string; rows: CountRow[]; limit?: number }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const shown = rows.slice(0, limit);
  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={rows.length > limit ? `Top ${limit} of ${rows.length}` : undefined}
      />
      <CardBody className="space-y-3">
        {shown.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No data yet.</p>}
        {shown.map((r) => (
          <div key={r.key}>
            <div className="flex justify-between text-sm">
              <span className="truncate text-slate-700">{label(r.key)}</span>
              <span className="ml-3 font-medium text-slate-900">{formatCount(r.count)}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-brand-600"
                style={{ width: `${total ? (r.count / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export default function AdminDataPage() {
  const { data, isLoading } = useGetDataSummaryQuery(undefined, { refetchOnMountOrArgChange: true });

  if (isLoading || !data) {
    return (
      <>
        <PageHeader title="Data Summary" description="Current stores and products on the platform." />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  const { stores, products } = data;

  return (
    <>
      <PageHeader
        title="Data Summary"
        description={`Current stores and products on the platform · updated ${new Date(
          data.generatedAt
        ).toLocaleString("en-PK")}`}
      />

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Stores</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total stores" value={formatCount(stores.total)} icon={<StoreIcon className="h-5 w-5" />} />
        <StatCard
          label="New stores"
          value={formatCount(stores.newThisWeek)}
          hint={`${formatCount(stores.newThisMonth)} in the last 30 days`}
          icon={<CalendarPlus className="h-5 w-5" />}
          tone="accent"
        />
        <StatCard
          label="Open now"
          value={formatCount(stores.open)}
          hint={`${formatCount(stores.total - stores.open)} closed`}
          icon={<DoorOpen className="h-5 w-5" />}
          tone="leaf"
        />
        <StatCard
          label="Without products"
          value={formatCount(stores.withoutProducts)}
          icon={<PackageX className="h-5 w-5" />}
          tone="gold"
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Breakdown title="By status" rows={stores.byStatus} />
        <Breakdown title="By city" rows={stores.byCity} />
        <Breakdown title="By category" rows={stores.byCategory} />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-slate-900">Products</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total products" value={formatCount(products.total)} icon={<Package className="h-5 w-5" />} />
        <StatCard
          label="New products"
          value={formatCount(products.newThisWeek)}
          hint={`${formatCount(products.newThisMonth)} in the last 30 days`}
          icon={<CalendarPlus className="h-5 w-5" />}
          tone="accent"
        />
        <StatCard
          label="Boosted now"
          value={formatCount(products.boosted)}
          icon={<Rocket className="h-5 w-5" />}
          tone="leaf"
        />
        <StatCard
          label="Avg per store"
          value={stores.total ? (products.total / stores.total).toFixed(1) : "0"}
          icon={<StoreIcon className="h-5 w-5" />}
          tone="slate"
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Breakdown title="By status" rows={products.byStatus} />
        <Breakdown title="By stock" rows={products.byStock} />
        <Breakdown title="By moderation" rows={products.byModeration} />
        <Breakdown title="By category" rows={products.byCategory} />
      </div>
    </>
  );
}
