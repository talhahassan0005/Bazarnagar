"use client";

import { useState } from "react";
import { Badge, Button, LoadingPanel } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { SubscriptionBadge } from "@/components/domain/StatusBadges";
import { ManageSellerModal } from "@/components/domain/ManageSellerModal";
import { useGetAllSellersQuery } from "@/store/apiSlice";
import { PLANS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { Seller } from "@/lib/types";

export default function AdminPlansPage() {
  const { data, isLoading } = useGetAllSellersQuery();
  const [editing, setEditing] = useState<Seller | null>(null);

  if (isLoading) return <LoadingPanel label="Loading subscriptions…" />;

  const columns: Column<Seller>[] = [
    {
      header: "Seller",
      cell: (s) => (
        <div>
          <p className="font-medium text-slate-800">{s.name}</p>
          <p className="text-xs text-slate-400">{s.email}</p>
        </div>
      ),
    },
    {
      header: "Plan",
      cell: (s) => (
        <Badge tone="brand">
          {PLANS[s.planId].name} · {formatPrice(PLANS[s.planId].price)}
        </Badge>
      ),
    },
    {
      header: "Subscription",
      cell: (s) => <SubscriptionBadge status={s.subscriptionStatus} />,
    },
    {
      header: "",
      className: "text-right",
      cell: (s) => (
        <Button variant="outline" size="sm" onClick={() => setEditing(s)}>
          Manage
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Plans & billing"
        description="Assign plans, set subscription status, and record manual payments."
      />

      <DataTable columns={columns} rows={data ?? []} />

      {editing && (
        <ManageSellerModal seller={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
