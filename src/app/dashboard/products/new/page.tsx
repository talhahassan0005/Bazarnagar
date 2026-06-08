"use client";

import { useRouter } from "next/navigation";
import { LoadingPanel } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { ProductForm } from "@/components/domain/ProductForm";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useGetSellerQuery } from "@/store/apiSlice";
import { addToast } from "@/store/uiSlice";
import { PLANS } from "@/lib/constants";

export default function NewProductPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const sellerId = useAppSelector((s) => s.auth.sellerId) ?? undefined;
  const { data: seller, isLoading } = useGetSellerQuery(sellerId);

  if (isLoading || !seller) return <LoadingPanel label="Loading…" />;

  return (
    <>
      <PageHeader
        title="Add product"
        description="New products go through a quick moderation check before going public."
      />
      <ProductForm
        plan={PLANS[seller.planId]}
        submitLabel="Add product"
        onSubmit={(values) => {
          // Wire to a createProduct mutation when the backend is ready.
          console.log("create product", values);
          dispatch(addToast(`"${values.name}" added — pending moderation.`, "success"));
          router.push("/dashboard/products");
        }}
      />
    </>
  );
}
