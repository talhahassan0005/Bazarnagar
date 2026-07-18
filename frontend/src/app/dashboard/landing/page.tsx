"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StoreLandingForm } from "@/components/domain/StoreLandingForm";
import { NeedsStore } from "@/components/domain/NeedsStore";
import { useAppDispatch } from "@/store/hooks";
import {
  useGetMyProductsQuery,
  useGetMyStoreQuery,
  useUpdateStoreLandingMutation,
} from "@/store/apiSlice";
import { addToast } from "@/store/uiSlice";
import { getErrorMessage } from "@/lib/utils";

export default function LandingCustomizerPage() {
  const dispatch = useAppDispatch();
  const { data: store, isLoading } = useGetMyStoreQuery();
  const { data: products } = useGetMyProductsQuery();
  const [updateLanding, { isLoading: saving }] = useUpdateStoreLandingMutation();

  if (isLoading) {
    return (
      <>
        <PageHeader title="Landing page" />
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </>
    );
  }

  if (!store) {
    return (
      <>
        <PageHeader title="Landing page" />
        <NeedsStore message="Create your store profile first, then design the landing page customers see." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Landing page"
        description="Design the branded page customers see at your store link."
      />

      {/* Prominent "view live" banner at the top — this is the customer-facing demo. */}
      <Link
        href={`/store/${store.slug}`}
        target="_blank"
        className="group mb-6 flex flex-col gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 transition-colors hover:bg-brand-100/60 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm font-semibold text-brand-900">See your live landing page</p>
          <p className="text-xs text-slate-500">
            This is exactly what customers see at{" "}
            <span className="font-medium text-brand-700">/store/{store.slug}</span> — click to open
            the demo.
          </p>
        </div>
        <span className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-brand-700 px-5 text-sm font-medium text-white transition-colors group-hover:bg-brand-800 sm:self-auto">
          View live page <ExternalLink className="h-4 w-4" />
        </span>
      </Link>

      <StoreLandingForm
        initial={store?.landing}
        products={products ?? []}
        saving={saving}
        onSubmit={async (landing) => {
          try {
            await updateLanding(landing).unwrap();
            dispatch(addToast("Landing page saved", "success"));
          } catch (err) {
            dispatch(
              addToast(getErrorMessage(err, "Could not save landing page"), "error")
            );
          }
        }}
      />
    </>
  );
}
