"use client";

import { useState } from "react";
import { Badge, Button, LoadingPanel, Modal, Select, Input, Textarea } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { SubscriptionBadge } from "@/components/domain/StatusBadges";
import { useGetAllSellersQuery } from "@/store/apiSlice";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { PLANS, PLAN_LIST } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { Seller, SubscriptionStatus } from "@/lib/types";

const SUB_STATUSES: SubscriptionStatus[] = [
  "trial",
  "active",
  "expired",
  "suspended",
  "cancelled",
];

export default function AdminPlansPage() {
  const dispatch = useAppDispatch();
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

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Manage — ${editing.name}` : ""}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                dispatch(addToast(`Updated subscription for ${editing?.name}`, "success"));
                setEditing(null);
              }}
            >
              Save changes
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Select
              label="Plan"
              defaultValue={editing.planId}
              options={PLAN_LIST.map((p) => ({
                value: p.id,
                label: `${p.name} — ${formatPrice(p.price)}/mo`,
              }))}
              onChange={() => {}}
            />
            <Select
              label="Subscription status"
              defaultValue={editing.subscriptionStatus}
              options={SUB_STATUSES.map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              }))}
              onChange={() => {}}
            />
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="mb-3 text-sm font-medium text-slate-700">Record payment</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Amount (Rs.)" type="number" placeholder="500" />
                <Input label="Date" type="date" />
                <Select
                  label="Method"
                  placeholder="Select"
                  options={[
                    { value: "cash", label: "Cash" },
                    { value: "bank", label: "Bank transfer" },
                    { value: "easypaisa", label: "EasyPaisa" },
                    { value: "jazzcash", label: "JazzCash" },
                  ]}
                  className="col-span-1"
                />
                <div className="col-span-1" />
                <Textarea className="col-span-2" label="Notes" rows={2} placeholder="Optional notes" />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
