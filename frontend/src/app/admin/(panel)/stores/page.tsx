"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Badge, Button, TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { useGetAllStoresQuery, useUpdateStoreStatusMutation } from "@/store/apiSlice";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { formatCount, getErrorMessage } from "@/lib/utils";
import type { Store, StoreStatus } from "@/lib/types";

const STATUS_TONE = { active: "green", inactive: "gray", pending: "amber" } as const;

export default function AdminStoresPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetAllStoresQuery();
  const [updateStoreStatus] = useUpdateStoreStatusMutation();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function setStoreStatus(s: Store, status: StoreStatus) {
    const key = `${s.id}:${status}`;
    setPendingKey(key);
    try {
      await updateStoreStatus({ id: s.id, status }).unwrap();
      dispatch(
        addToast(
          `${s.name} ${status === "active" ? "activated" : "deactivated"}`,
          status === "active" ? "success" : "error"
        )
      );
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Update failed"), "error"));
    } finally {
      setPendingKey(null);
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Stores" description="View and moderate seller storefronts." />
        <TableSkeleton />
      </>
    );
  }

  const columns: Column<Store>[] = [
    {
      header: "Store",
      cell: (s) => (
        <div>
          <p className="font-medium text-slate-800">{s.name}</p>
          <p className="text-xs text-slate-400">/store/{s.slug}</p>
        </div>
      ),
    },
    { header: "Category", hideOnMobile: true, cell: (s) => s.category },
    { header: "City", hideOnMobile: true, cell: (s) => s.city },
    { header: "Views", cell: (s) => formatCount(s.views) },
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
          <Button
            href={`/store/${s.slug}`}
            target="_blank"
            variant="ghost"
            size="sm"
            leftIcon={<ExternalLink className="h-4 w-4" />}
          >
            View
          </Button>
          {s.status === "active" ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => setStoreStatus(s, "inactive")}
              loading={pendingKey === `${s.id}:inactive`}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStoreStatus(s, "active")}
              loading={pendingKey === `${s.id}:active`}
            >
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Stores" description="View and moderate seller storefronts." />
      <DataTable
        columns={columns}
        rows={data ?? []}
        empty={<p className="py-10 text-center text-sm text-slate-400">No stores yet.</p>}
      />
    </>
  );
}
