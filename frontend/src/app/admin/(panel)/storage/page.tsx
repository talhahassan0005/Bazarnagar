"use client";

import { useState } from "react";
import { ExternalLink, Files, HardDrive, Store as StoreIcon } from "lucide-react";
import { Badge, Button, StatCardSkeleton, TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { StatCard } from "@/components/domain/StatCard";
import { useGetStorageUsageQuery } from "@/store/apiSlice";
import { PLANS } from "@/lib/constants";
import { cn, formatBytes, formatCount } from "@/lib/utils";
import type { StorageUsageRow } from "@/lib/types";

export default function AdminStoragePage() {
  const [scope, setScope] = useState<"paid" | "all">("paid");
  const { data, isLoading, isFetching } = useGetStorageUsageQuery(scope, {
    refetchOnMountOrArgChange: true,
  });

  const columns: Column<StorageUsageRow>[] = [
    {
      header: "Store",
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-800">{r.storeName}</p>
          <p className="font-mono text-[11px] text-slate-400" title="Store ID">
            {r.storeId}
          </p>
        </div>
      ),
    },
    {
      header: "Plan",
      cell: (r) => (
        <Badge tone={r.planId === "starter" ? "gray" : "brand"}>{PLANS[r.planId]?.name ?? r.planId}</Badge>
      ),
    },
    {
      header: "Seller",
      hideOnMobile: true,
      cell: (r) => (
        <div>
          <p className="text-slate-700">{r.sellerName}</p>
          <p className="text-xs text-slate-400">{r.sellerEmail}</p>
        </div>
      ),
    },
    { header: "Files", cell: (r) => formatCount(r.files) },
    {
      header: "Storage used",
      cell: (r) => <span className="font-semibold text-slate-900">{formatBytes(r.bytes)}</span>,
    },
    {
      header: "Last upload",
      hideOnMobile: true,
      cell: (r) => (
        <span className="whitespace-nowrap text-slate-500">
          {r.lastUpload ? new Date(r.lastUpload).toLocaleString("en-PK") : "—"}
        </span>
      ),
    },
    {
      header: "",
      className: "text-right",
      cell: (r) => (
        <Button
          href={`/store/${r.storeSlug}`}
          target="_blank"
          variant="ghost"
          size="sm"
          leftIcon={<ExternalLink className="h-4 w-4" />}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Storage Usage"
        description="Images each store has uploaded (product photos, logo, cover), by store ID."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["paid", "all"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={scope === s ? "primary" : "outline"}
            onClick={() => setScope(s)}
          >
            {s === "paid" ? "Paid stores" : "All stores"}
          </Button>
        ))}
      </div>

      {isLoading || !data ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <TableSkeleton />
        </>
      ) : (
        <div className={cn(isFetching && "opacity-60 transition-opacity")}>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label={scope === "paid" ? "Paid stores" : "Stores"}
              value={formatCount(data.totals.stores)}
              icon={<StoreIcon className="h-5 w-5" />}
            />
            <StatCard
              label="Files stored"
              value={formatCount(data.totals.files)}
              icon={<Files className="h-5 w-5" />}
              tone="accent"
            />
            <StatCard
              label="Total storage"
              value={formatBytes(data.totals.bytes)}
              icon={<HardDrive className="h-5 w-5" />}
              tone="leaf"
            />
          </div>
          <DataTable
            columns={columns}
            rows={data.rows.map((r) => ({ ...r, id: r.storeId }))}
            empty={
              <p className="py-10 text-center text-sm text-slate-400">
                {scope === "paid" ? "No paid stores yet." : "No stores yet."}
              </p>
            }
          />
        </div>
      )}
    </>
  );
}
