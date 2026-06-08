"use client";

import { Skeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StoreProfileForm } from "@/components/domain/StoreProfileForm";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useGetMyStoreQuery } from "@/store/apiSlice";
import { addToast } from "@/store/uiSlice";

export default function StoreProfilePage() {
  const dispatch = useAppDispatch();
  const sellerId = useAppSelector((s) => s.auth.sellerId) ?? undefined;
  const { data: store, isLoading } = useGetMyStoreQuery(sellerId);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Store profile" />
        <div className="space-y-6">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Store profile"
        description="This information powers your public shop page."
      />
      <StoreProfileForm
        initial={store ?? undefined}
        onSubmit={(values) => {
          // Wire to an updateStore mutation when the backend is ready.
          console.log("save store", values);
          dispatch(addToast("Store profile saved", "success"));
        }}
      />
    </>
  );
}
