"use client";

import { useState } from "react";
import { Check, FilePen, Flag, ShieldCheck, X } from "lucide-react";
import { Card, CardBody, Button, LoadingPanel, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { ModerationBadge } from "@/components/domain/StatusBadges";
import { useGetAllProductsQuery, useModerateProductMutation } from "@/store/apiSlice";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { MODERATION_META } from "@/lib/constants";
import { formatPrice, getErrorMessage } from "@/lib/utils";
import type { ModerationStatus } from "@/lib/types";

const ACTIONS: {
  status: ModerationStatus;
  label: string;
  icon: typeof Check;
  variant: "primary" | "danger" | "outline";
}[] = [
  { status: "approved", label: "Approve", icon: Check, variant: "primary" },
  { status: "needs_edit", label: "Needs edit", icon: FilePen, variant: "outline" },
  { status: "flagged", label: "Flag", icon: Flag, variant: "outline" },
  { status: "rejected", label: "Reject", icon: X, variant: "danger" },
];

export default function AdminModerationPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetAllProductsQuery();
  const [moderateProduct] = useModerateProductMutation();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  if (isLoading) return <LoadingPanel label="Loading moderation queue…" />;

  const items = data ?? [];
  const queue = items.filter(
    (p) => p.moderationStatus === "pending" || p.moderationStatus === "flagged"
  );

  async function setStatus(id: string, status: ModerationStatus) {
    const name = items.find((p) => p.id === id)?.name ?? "Product";
    const key = `${id}:${status}`;
    setPendingKey(key);
    try {
      await moderateProduct({ id, moderationStatus: status }).unwrap();
      dispatch(
        addToast(
          `"${name}" marked ${MODERATION_META[status].label}`,
          status === "rejected" ? "error" : "success"
        )
      );
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Update failed"), "error"));
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Moderation"
        description="Review products before they go public. Safe products can be approved; risky ones flagged or rejected."
      />

      {queue.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Queue is clear"
          description="No products are pending review right now."
        />
      ) : (
        <div className="space-y-4">
          {queue.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex flex-col gap-4 sm:flex-row">
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="h-28 w-28 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{p.name}</h3>
                    <ModerationBadge status={p.moderationStatus} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {p.store.name} · {p.category} · {formatPrice(p.price)}
                  </p>
                  {p.description && (
                    <p className="mt-2 text-sm text-slate-600">{p.description}</p>
                  )}
                  {p.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.tags.map((t) => (
                        <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {ACTIONS.map((a) => (
                      <Button
                        key={a.status}
                        size="sm"
                        variant={a.variant}
                        onClick={() => setStatus(p.id, a.status)}
                        loading={pendingKey === `${p.id}:${a.status}`}
                        leftIcon={<a.icon className="h-4 w-4" />}
                      >
                        {a.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
