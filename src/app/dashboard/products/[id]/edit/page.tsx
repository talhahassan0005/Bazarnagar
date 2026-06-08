"use client";

import { useParams, useRouter } from "next/navigation";
import { LoadingPanel, EmptyState, Button } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { ProductForm } from "@/components/domain/ProductForm";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useGetProductQuery, useGetSellerQuery } from "@/store/apiSlice";
import { addToast } from "@/store/uiSlice";
import { PLANS } from "@/lib/constants";

export default function EditProductPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const sellerId = useAppSelector((s) => s.auth.sellerId) ?? undefined;
  const { data: product, isLoading } = useGetProductQuery(id);
  const { data: seller } = useGetSellerQuery(sellerId);

  if (isLoading || !seller) return <LoadingPanel label="Loading product…" />;

  if (!product) {
    return (
      <EmptyState
        title="Product not found"
        description="This product may have been deleted."
        action={<Button href="/dashboard/products">Back to products</Button>}
      />
    );
  }

  return (
    <>
      <PageHeader title="Edit product" description={product.name} />
      <ProductForm
        initial={product}
        plan={PLANS[seller.planId]}
        submitLabel="Save changes"
        onSubmit={(values) => {
          // Wire to an updateProduct mutation when the backend is ready.
          console.log("update product", id, values);
          dispatch(addToast(`Saved changes to "${values.name}"`, "success"));
          router.push("/dashboard/products");
        }}
      />
    </>
  );
}
