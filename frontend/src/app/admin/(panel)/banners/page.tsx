"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Modal, TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { BannerFormModal } from "@/components/domain/BannerFormModal";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useDeleteBannerMutation, useGetAllBannersQuery } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";
import type { Banner } from "@/lib/types";

export default function AdminBannersPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetAllBannersQuery();
  const [deleteBanner, { isLoading: deleting }] = useDeleteBannerMutation();

  const [editing, setEditing] = useState<Banner | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Banner | null>(null);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteBanner(toDelete.id).unwrap();
      dispatch(addToast("Banner deleted", "success"));
      setToDelete(null);
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not delete banner"), "error"));
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Banner Ads" description="Manage banner ads shown on free-plan shop pages." />
        <TableSkeleton />
      </>
    );
  }

  const rows = data ?? [];

  const columns: Column<Banner>[] = [
    {
      header: "Banner",
      cell: (b) => (
        <div className="flex items-center gap-3">
          <img src={b.imageUrl} alt={b.title ?? "Banner"} className="h-10 w-20 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{b.title || "Untitled banner"}</p>
            {b.linkUrl && <p className="truncate text-xs text-slate-400">{b.linkUrl}</p>}
          </div>
        </div>
      ),
    },
    { header: "Category", hideOnMobile: true, cell: (b) => b.category || "All shops" },
    {
      header: "Placement",
      hideOnMobile: true,
      cell: (b) =>
        b.placement === "top"
          ? "Top"
          : b.placement === "bottom"
            ? "Bottom"
            : b.placement === "sidebar"
              ? "Sidebar"
              : "Anywhere",
    },
    { header: "Order", hideOnMobile: true, cell: (b) => b.order },
    {
      header: "Status",
      cell: (b) => (
        <Badge tone={b.active ? "green" : "gray"}>{b.active ? "Active" : "Inactive"}</Badge>
      ),
    },
    {
      header: "",
      className: "text-right",
      cell: (b) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => setEditing(b)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setToDelete(b)}
            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Banner Ads"
        description="Banner ads shown on the shop page of sellers on the free (Starter) plan."
        action={
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>
            Add banner
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        empty={
          <div className="py-10 text-center text-sm text-slate-400">
            <p>No banner ads yet.</p>
            <Button size="sm" className="mt-3" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>
              Add your first banner
            </Button>
          </div>
        }
      />

      {editing && (
        <BannerFormModal
          banner={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {toDelete && (
        <Modal
          open
          onClose={() => setToDelete(null)}
          title="Delete banner?"
          footer={
            <>
              <Button variant="outline" onClick={() => setToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" loading={deleting} onClick={confirmDelete}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            This will remove &ldquo;{toDelete.title || "this banner"}&rdquo; from all shop pages. This can&apos;t be undone.
          </p>
        </Modal>
      )}
    </>
  );
}
