"use client";

import { useState } from "react";
import { Check, ExternalLink, Store as StoreIcon } from "lucide-react";
import { Avatar, Badge, Button, Card, EmptyState, ListRowsSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { LoadError } from "@/components/domain/LoadError";
import {
  useGetStoreReviewsQuery,
  useMarkStoreReviewedMutation,
  useUpdateStoreStatusMutation,
} from "@/store/apiSlice";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { cn, getErrorMessage } from "@/lib/utils";
import type { StoreReviewItem } from "@/lib/types";

type Tab = "pending" | "reviewed";

/** Friendly names for the store fields a seller can change. */
const FIELD_LABEL: Record<string, string> = {
  name: "Name",
  description: "Description",
  category: "Category",
  whatsapp: "WhatsApp",
  city: "City",
  area: "Area",
  fullAddress: "Address",
  mapsLink: "Map link",
  lat: "Map pin",
  lng: "Map pin",
  logoUrl: "Logo",
  coverUrl: "Cover image",
  showLocation: "Show location",
  showInSearch: "Show in search",
  isOpen: "Open / closed",
  socials: "Social links",
  deliveryInfo: "Delivery info",
  noDelivery: "No delivery",
  paymentInfo: "Payment info",
  landing: "Landing page",
};

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-PK") : "—");

function ReviewCard({ store, tab }: { store: StoreReviewItem; tab: Tab }) {
  const dispatch = useAppDispatch();
  const [markReviewed, { isLoading: marking }] = useMarkStoreReviewedMutation();
  const [updateStatus, { isLoading: deactivating }] = useUpdateStoreStatusMutation();
  const review = store.review!;
  const changes = [...new Set(review.changes.map((c) => FIELD_LABEL[c] ?? c))];

  async function run(action: () => Promise<unknown>, done: string) {
    try {
      await action();
      dispatch(addToast(done, "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Update failed"), "error"));
    }
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover" />
          ) : (
            <Avatar name={store.name} size={48} />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">{store.name}</p>
              <Badge tone={review.reason === "created" ? "blue" : "amber"}>
                {review.reason === "created" ? "New store" : "Edited"}
              </Badge>
              {store.status !== "active" && <Badge tone="gray">{store.status}</Badge>}
            </div>
            <p className="text-xs text-slate-400">
              {store.category} · {store.city} · /store/{store.slug}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {store.sellerName} <span className="text-slate-400">· {store.sellerEmail} · {store.sellerPhone}</span>
            </p>
            {review.reason === "updated" && changes.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500">Changed:</span>
                {changes.map((c) => (
                  <span key={c} className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                    {c}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-400">
              {tab === "pending" ? `Waiting since ${when(review.requestedAt)}` : `Reviewed ${when(review.reviewedAt)}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            href={`/store/${store.slug}`}
            target="_blank"
            variant="outline"
            size="sm"
            leftIcon={<ExternalLink className="h-4 w-4" />}
          >
            Check store
          </Button>
          {tab === "pending" && (
            <>
              <Button
                size="sm"
                loading={marking}
                leftIcon={<Check className="h-4 w-4" />}
                onClick={() => run(() => markReviewed(store.id).unwrap(), `${store.name} marked as reviewed`)}
              >
                Mark as reviewed
              </Button>
              {store.status === "active" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50"
                  loading={deactivating}
                  onClick={() => {
                    if (!window.confirm(`Deactivate ${store.name}? The shop will be hidden from customers.`)) return;
                    run(() => updateStatus({ id: store.id, status: "inactive" }).unwrap(), `${store.name} deactivated`);
                  }}
                >
                  Deactivate
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function AdminStoreReviewPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const { data, isLoading, isFetching, isError, error, refetch } = useGetStoreReviewsQuery(tab, {
    refetchOnMountOrArgChange: true,
  });

  return (
    <>
      <PageHeader
        title="Store Review"
        description="Stores land here when they're created or edited. Check each one, then mark it as reviewed."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant={tab === "pending" ? "primary" : "outline"} onClick={() => setTab("pending")}>
          To be reviewed{tab === "pending" && data ? ` (${data.length})` : ""}
        </Button>
        <Button size="sm" variant={tab === "reviewed" ? "primary" : "outline"} onClick={() => setTab("reviewed")}>
          Reviewed
        </Button>
      </div>

      {isError ? (
        <LoadError what="stores to review" error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Card className="p-4">
          <ListRowsSkeleton rows={4} />
        </Card>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<StoreIcon className="h-6 w-6" />}
          title={tab === "pending" ? "Nothing to review" : "No reviewed stores yet"}
          description={
            tab === "pending"
              ? "New and edited stores will show up here."
              : "Stores you mark as reviewed will be listed here."
          }
        />
      ) : (
        <div className={cn("space-y-3", isFetching && "opacity-60 transition-opacity")}>
          {data.map((s) => (
            <ReviewCard key={s.id} store={s} tab={tab} />
          ))}
        </div>
      )}
    </>
  );
}
