"use client";

import { useRouter } from "next/navigation";
import { LoadingPanel } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { ProductForm } from "@/components/domain/ProductForm";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  useCreateProductMutation,
  useGetMyStoreQuery,
  useGetSellerQuery,
} from "@/store/apiSlice";
import { addToast } from "@/store/uiSlice";
import { PLANS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils";
import { NeedsStore } from "@/components/domain/NeedsStore";

export default function NewProductPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const sellerId = useAppSelector((s) => s.auth.sellerId) ?? undefined;
  const { data: seller, isLoading } = useGetSellerQuery(sellerId);
  const { data: store, isLoading: storeLoading } = useGetMyStoreQuery(sellerId);
  const [createProduct, { isLoading: saving }] = useCreateProductMutation();

  if (isLoading || storeLoading || !seller) return <LoadingPanel label="Loading…" />;

  if (!store) {
    return (
      <>
        <PageHeader title="Add product" />
        <NeedsStore message="Create your store profile before adding products." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Add product"
        description="New products go through a quick moderation check before going public."
      />
      <ProductForm
        plan={PLANS[seller.planId]}
        submitLabel="Add product"
        loading={saving}
        onSubmit={async (values) => {
          try {
            await createProduct(values).unwrap();
            dispatch(addToast(`"${values.name}" added — pending moderation.`, "success"));
            router.push("/dashboard/products");
          } catch (err) {
            dispatch(
              addToast(getErrorMessage(err, "Could not add product"), "error")
            );
          }
        }}
      />
    </>
  );
}
