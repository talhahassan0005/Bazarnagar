"use client";

import { useState } from "react";
import { EyeOff, ExternalLink } from "lucide-react";
import { Badge, BrandLoader, Button, ConfirmDialog } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { CopyId } from "@/components/domain/CopyId";
import { useGetAllStoresQuery, useUpdateStoreStatusMutation, useToggleStoreHideFromLandingMutation } from "@/store/apiSlice";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { formatCount, getErrorMessage } from "@/lib/utils";
import type { Store, StoreStatus } from "@/lib/types";

const STATUS_TONE = { active: "green", inactive: "gray", pending: "amber" } as const;

export default function AdminStoresPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetAllStoresQuery();
  const [updateStoreStatus] = useUpdateStoreStatusMutation();
  const [toggleHideFromLanding] = useToggleStoreHideFromLandingMutation();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ store: Store; status: StoreStatus } | null>(null);

  async function applyStoreStatus() {
    if (!confirm) return;
    const { store: s, status } = confirm;
    const key = `${s.id}:${status}`;
    setPendingKey(key);
    setConfirm(null);
    try {
      await updateStoreStatus({ id: s.id, status }).unwrap();
      dispatch(addToast(`${s.name} ${status === "active" ? "activated" : "deactivated"}`, status === "active" ? "success" : "error"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Update failed"), "error"));
    } finally {
      setPendingKey(null);
    }
  }

  async function handleToggleLanding(s: Store) {
    const next = !s.hideFromLanding;
    const key = `${s.id}:landing`;
    setPendingKey(key);
    try {
      await toggleHideFromLanding({ id: s.id, hideFromLanding: next }).unwrap();
      dispatch(addToast(
        next ? `${s.name} hidden from landing page` : `${s.name} shown on landing page`,
        next ? "error" : "success"
      ));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Update failed"), "error"));
    } finally {
      setPendingKey(null);
    }
  }

  if (isLoading) return <BrandLoader />;

  const columns: Column<Store>[] = [
    {
      header: "Store",
      cell: (s) => (
        <div>
          <p className="font-medium text-slate-800">{s.name}</p>
          <p className="text-xs text-slate-400">/store/{s.slug}</p>
          <CopyId id={s.id} />
        </div>
      ),
    },
    { header: "Category", hideOnMobile: true, cell: (s) => s.category },
    { header: "City", hideOnMobile: true, cell: (s) => s.city },
    { header: "Views", cell: (s) => formatCount(s.views) },
    { header: "WhatsApp clicks", hideOnMobile: true, cell: (s) => formatCount(s.whatsappClicks) },
    { header: "Add to cart", hideOnMobile: true, cell: (s) => formatCount(s.addToCartClicks ?? 0) },
    { header: "Buy now", hideOnMobile: true, cell: (s) => formatCount(s.buyNowClicks ?? 0) },
    {
      header: "Status",
      cell: (s) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={STATUS_TONE[s.status]} className="capitalize">
            {s.status}
          </Badge>
          {s.review?.status === "pending" && <Badge tone="amber">Needs review</Badge>}
          {s.hideFromLanding && (
            <Badge tone="gray" className="flex items-center gap-1">
              <EyeOff className="h-3 w-3" /> Hidden from landing
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Action",
      className: "text-right",
      cell: (s) => (
        <div className="flex flex-wrap justify-end gap-1">
          <Button
            href={`/store/${s.slug}`}
            target="_blank"
            variant="ghost"
            size="sm"
            leftIcon={<ExternalLink className="h-4 w-4" />}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={s.hideFromLanding ? "text-brand-600 hover:bg-brand-50" : "text-slate-500 hover:bg-slate-100"}
            onClick={() => handleToggleLanding(s)}
            loading={pendingKey === `${s.id}:landing`}
            title={s.hideFromLanding ? "Show on landing page" : "Hide from landing page"}
          >
            {s.hideFromLanding ? "Show on landing" : "Hide from landing"}
          </Button>
          {s.status === "active" ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => setConfirm({ store: s, status: "inactive" })}
              loading={pendingKey === `${s.id}:inactive`}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirm({ store: s, status: "active" })}
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

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.status === "inactive" ? "Deactivate store?" : "Activate store?"}
        message={
          confirm?.status === "inactive"
            ? `"${confirm?.store.name}" will be hidden from public search and won't be visible to buyers.`
            : `"${confirm?.store.name}" will become visible to buyers in public search.`
        }
        confirmLabel={confirm?.status === "inactive" ? "Deactivate" : "Activate"}
        onConfirm={applyStoreStatus}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
