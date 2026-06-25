"use client";

import { Skeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StoreProfileForm } from "@/components/domain/StoreProfileForm";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useGetMyStoreQuery, useUpsertStoreMutation } from "@/store/apiSlice";
import { addToast } from "@/store/uiSlice";
import { getErrorMessage } from "@/lib/utils";

export default function StoreProfilePage() {
  const dispatch = useAppDispatch();
  const sellerId = useAppSelector((s) => s.auth.sellerId) ?? undefined;
  const { data: store, isLoading } = useGetMyStoreQuery(sellerId);
  const [upsertStore, { isLoading: saving }] = useUpsertStoreMutation();

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
        loading={saving}
        onSubmit={async (values) => {
          try {
            await upsertStore(values).unwrap();
            dispatch(addToast("Store profile saved", "success"));
          } catch (err) {
            dispatch(
              addToast(getErrorMessage(err, "Could not save store"), "error")
            );
          }
        }}
      />
    </>
  );
}
