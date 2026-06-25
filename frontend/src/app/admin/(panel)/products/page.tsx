"use client";

import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { CategoryChips } from "@/components/domain/CategoryChips";
import {
  ModerationBadge,
  ProductStatusBadge,
} from "@/components/domain/StatusBadges";
import { useGetAllProductsQuery } from "@/store/apiSlice";
import { MODERATION_META } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { ModerationStatus, ProductWithStore } from "@/lib/types";

const MOD_FILTERS = Object.keys(MODERATION_META) as ModerationStatus[];

export default function AdminProductsPage() {
  const { data, isLoading } = useGetAllProductsQuery();
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("");

  if (isLoading) {
    return (
      <>
        <PageHeader title="Products" description="All products across the platform." />
        <TableSkeleton />
      </>
    );
  }

  const rows = (data ?? []).filter((p) => {
    if (mod && p.moderationStatus !== mod) return false;
    if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !p.store.name.toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });

  const columns: Column<ProductWithStore>[] = [
    {
      header: "Product",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{p.name}</p>
            <p className="text-xs text-slate-400">{p.store.name}</p>
          </div>
        </div>
      ),
    },
    { header: "Price", hideOnMobile: true, cell: (p) => formatPrice(p.price) },
    { header: "Status", hideOnMobile: true, cell: (p) => <ProductStatusBadge status={p.status} /> },
    { header: "Moderation", cell: (p) => <ModerationBadge status={p.moderationStatus} /> },
    {
      header: "",
      className: "text-right",
      cell: () => (
        <button className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Remove">
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Products" description="All products across the platform." />

      <div className="mb-4 space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products or stores…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <CategoryChips
          categories={MOD_FILTERS.map((s) => MODERATION_META[s].label)}
          value={mod ? MODERATION_META[mod as ModerationStatus].label : ""}
          onChange={(label) => {
            const found = MOD_FILTERS.find((s) => MODERATION_META[s].label === label);
            setMod(found ?? "");
          }}
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        empty={<p className="py-10 text-center text-sm text-slate-400">No products match.</p>}
      />
    </>
  );
}
