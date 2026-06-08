"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Badge, Button, TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { SubscriptionBadge } from "@/components/domain/StatusBadges";
import { Avatar } from "@/components/ui";
import { useGetAllSellersQuery } from "@/store/apiSlice";
import { PLANS } from "@/lib/constants";
import type { Seller } from "@/lib/types";

const STATUS_TONE = { active: "green", inactive: "gray", suspended: "red" } as const;

export default function AdminSellersPage() {
  const { data, isLoading } = useGetAllSellersQuery();
  const [q, setQ] = useState("");

  if (isLoading) {
    return (
      <>
        <PageHeader title="Sellers" description="Manage seller accounts, plans and status." />
        <TableSkeleton />
      </>
    );
  }

  const rows = (data ?? []).filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.email.toLowerCase().includes(q.toLowerCase()) ||
      s.phone.includes(q)
  );

  const columns: Column<Seller>[] = [
    {
      header: "Seller",
      cell: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size={36} />
          <div>
            <p className="font-medium text-slate-800">{s.name}</p>
            <p className="text-xs text-slate-400">{s.email}</p>
          </div>
        </div>
      ),
    },
    { header: "Phone", hideOnMobile: true, cell: (s) => s.phone },
    {
      header: "Plan",
      cell: (s) => <Badge tone="brand">{PLANS[s.planId].name}</Badge>,
    },
    {
      header: "Subscription",
      hideOnMobile: true,
      cell: (s) => <SubscriptionBadge status={s.subscriptionStatus} />,
    },
    {
      header: "Status",
      cell: (s) => (
        <Badge tone={STATUS_TONE[s.status]} className="capitalize">
          {s.status}
        </Badge>
      ),
    },
    {
      header: "",
      className: "text-right",
      cell: (s) => (
        <div className="flex justify-end gap-1">
          {s.status === "suspended" ? (
            <Button variant="ghost" size="sm">
              Reactivate
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
              Suspend
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Sellers" description="Manage seller accounts, plans and status." />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search sellers…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        empty={<p className="py-10 text-center text-sm text-slate-400">No sellers found.</p>}
      />
    </>
  );
}
