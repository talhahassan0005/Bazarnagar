"use client";

import { useState } from "react";
import { Check, Star, X } from "lucide-react";
import { Button, Card, EmptyState, LoadingPanel } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StarRating } from "@/components/storefront/StarRating";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useGetAllReviewsQuery, useModerateReviewMutation } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";
import type { ReviewStatus } from "@/lib/types";

const STATUS_CLASS: Record<ReviewStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-leaf-500/15 text-leaf-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminReviewsPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetAllReviewsQuery();
  const [moderateReview] = useModerateReviewMutation();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  if (isLoading) return <LoadingPanel label="Loading reviews…" />;

  // Pending first, then most recent.
  const reviews = [...(data ?? [])].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  async function setStatus(id: string, status: ReviewStatus) {
    setPendingKey(`${id}:${status}`);
    try {
      await moderateReview({ id, status }).unwrap();
      dispatch(addToast(`Review ${status}`, status === "rejected" ? "error" : "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Update failed"), "error"));
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Reviews"
        description={`${pendingCount} pending · approve before they show on the shop.`}
      />

      {reviews.length === 0 ? (
        <EmptyState
          icon={<Star className="h-6 w-6" />}
          title="No reviews yet"
          description="Customer reviews will appear here for moderation."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{r.customerName}</span>
                    <StarRating value={r.rating} size={14} />
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_CLASS[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">on {r.productName}</p>
                  {r.comment && <p className="mt-2 text-sm text-slate-600">{r.comment}</p>}
                </div>
                <div className="flex gap-2">
                  {r.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Check className="h-4 w-4" />}
                      loading={pendingKey === `${r.id}:approved`}
                      onClick={() => setStatus(r.id, "approved")}
                    >
                      Approve
                    </Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={<X className="h-4 w-4" />}
                      loading={pendingKey === `${r.id}:rejected`}
                      onClick={() => setStatus(r.id, "rejected")}
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
