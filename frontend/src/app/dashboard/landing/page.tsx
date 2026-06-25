"use client";

import { ExternalLink } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StoreLandingForm } from "@/components/domain/StoreLandingForm";
import { NeedsStore } from "@/components/domain/NeedsStore";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  useGetMyProductsQuery,
  useGetMyStoreQuery,
  useUpdateStoreLandingMutation,
} from "@/store/apiSlice";
import { addToast } from "@/store/uiSlice";
import { getErrorMessage } from "@/lib/utils";

export default function LandingCustomizerPage() {
  const dispatch = useAppDispatch();
  const sellerId = useAppSelector((s) => s.auth.sellerId) ?? undefined;
  const { data: store, isLoading } = useGetMyStoreQuery(sellerId);
  const { data: products } = useGetMyProductsQuery(sellerId);
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
        action={
          store && (
            <Button
              href={`/store/${store.slug}`}
              target="_blank"
              variant="outline"
              rightIcon={<ExternalLink className="h-4 w-4" />}
            >
              View live
            </Button>
          )
        }
      />
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
