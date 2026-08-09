"use client";

import { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { Badge, Button, Modal, TableSkeleton, Textarea } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { SubscriptionBadge } from "@/components/domain/StatusBadges";
import { Avatar } from "@/components/ui";
import { useGetAllSellersQuery, useUpdateSellerMutation } from "@/store/apiSlice";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { PLANS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils";
import type { Seller } from "@/lib/types";

const STATUS_TONE = { pending: "amber", active: "green", inactive: "gray", suspended: "red" } as const;

/** KYC document viewer + approve/reject, for a seller awaiting verification. */
function KycReviewModal({ seller, onClose }: { seller: Seller; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [updateSeller] = useUpdateSellerMutation();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState<"approve" | "reject" | null>(null);

  async function approve() {
    setSaving("approve");
    try {
      await updateSeller({ id: seller.id, status: "active" }).unwrap();
      dispatch(addToast(`${seller.name} approved — their shop is now live.`, "success"));
      onClose();
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not approve seller"), "error"));
    } finally {
      setSaving(null);
    }
  }

  async function reject() {
    if (!reason.trim()) {
      dispatch(addToast("Add a reason so the seller knows what to fix", "error"));
      return;
    }
    setSaving("reject");
    try {
      await updateSeller({ id: seller.id, status: "pending", kycRejectionReason: reason.trim() }).unwrap();
      dispatch(addToast(`${seller.name}'s documents were rejected.`, "info"));
      onClose();
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not reject documents"), "error"));
    } finally {
      setSaving(null);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Verify ${seller.name}`}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Submitted {seller.kycSubmittedAt ? new Date(seller.kycSubmittedAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) : "—"}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500">CNIC — front</p>
            {seller.kycCnicFront ? (
              <a href={seller.kycCnicFront} target="_blank" rel="noopener noreferrer">
                <img src={seller.kycCnicFront} alt="CNIC front" className="w-full rounded-lg border border-slate-200 object-cover" />
              </a>
            ) : (
              <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                Not uploaded
              </div>
            )}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500">CNIC — back</p>
            {seller.kycCnicBack ? (
              <a href={seller.kycCnicBack} target="_blank" rel="noopener noreferrer">
                <img src={seller.kycCnicBack} alt="CNIC back" className="w-full rounded-lg border border-slate-200 object-cover" />
              </a>
            ) : (
              <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                Not uploaded
              </div>
            )}
          </div>
        </div>
        <Textarea
          label="Rejection reason (only needed if rejecting)"
          placeholder="e.g. CNIC photo is blurry, please re-upload"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50"
            loading={saving === "reject"}
            disabled={!seller.kycCnicFront || !seller.kycCnicBack}
            onClick={reject}
          >
            Reject
          </Button>
          <Button loading={saving === "approve"} disabled={!seller.kycCnicFront || !seller.kycCnicBack} onClick={approve}>
            Approve
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminSellersPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetAllSellersQuery();
  const [updateSeller] = useUpdateSellerMutation();
  const [q, setQ] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<Seller | null>(null);

  async function setSellerStatus(s: Seller, status: "active" | "suspended") {
    const key = `${s.id}:${status}`;
    setPendingKey(key);
    try {
      await updateSeller({ id: s.id, status }).unwrap();
      dispatch(
        addToast(
          `${s.name} ${status === "suspended" ? "suspended" : "reactivated"}`,
          status === "suspended" ? "error" : "success"
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
          {s.status === "pending" ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-700 hover:bg-brand-50"
              leftIcon={<ShieldCheck className="h-4 w-4" />}
              onClick={() => setReviewing(s)}
              disabled={!s.kycSubmittedAt}
            >
              {s.kycSubmittedAt ? "Review KYC" : "Awaiting docs"}
            </Button>
          ) : s.status === "suspended" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSellerStatus(s, "active")}
              loading={pendingKey === `${s.id}:active`}
            >
              Reactivate
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => setSellerStatus(s, "suspended")}
              loading={pendingKey === `${s.id}:suspended`}
            >
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

      {reviewing && <KycReviewModal seller={reviewing} onClose={() => setReviewing(null)} />}
    </>
  );
}
