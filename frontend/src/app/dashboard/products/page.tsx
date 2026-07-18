"use client";

import { useState } from "react";
import { Package, Pencil, Plus, Rocket, Trash2 } from "lucide-react";
import { Button, Card, TableSkeleton, EmptyState, Modal } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import {
  ModerationBadge,
  ProductStatusBadge,
  StockBadge,
} from "@/components/domain/StatusBadges";
import { useAppDispatch } from "@/store/hooks";
import {
  useBoostProductMutation,
  useDeleteProductMutation,
  useGetMyProductsQuery,
  useGetSellerQuery,
} from "@/store/apiSlice";
import { addToast } from "@/store/uiSlice";
import { BOOST_PACKAGES, PLANS } from "@/lib/constants";
import { formatCount, formatPrice, getErrorMessage, isBoosted } from "@/lib/utils";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const { data: products, isLoading } = useGetMyProductsQuery();
  const { data: seller } = useGetSellerQuery();
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();
  const [boostProduct, { isLoading: boosting }] = useBoostProductMutation();
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [toBoost, setToBoost] = useState<Product | null>(null);
  const [pkgId, setPkgId] = useState<string>(BOOST_PACKAGES[0]?.id ?? "");

  if (isLoading) {
    return (
      <>
        <PageHeader title="Products" />
        <TableSkeleton rows={5} />
      </>
    );
  }

  const list = products ?? [];
  const plan = seller ? PLANS[seller.planId] : null;
  const atLimit = plan ? list.length >= plan.productLimit : false;
  const isPaid = seller ? seller.planId !== "starter" : false;

  return (
    <>
      <PageHeader
        title="Products"
        description={
          plan
            ? plan.productLimit >= 1_000_000
              ? `${list.length} products`
              : `${list.length} of ${plan.productLimit} products used`
            : undefined
        }
        action={
          <Button
            href="/dashboard/products/new"
            leftIcon={<Plus className="h-4 w-4" />}
            disabled={atLimit}
          >
            Add product
          </Button>
        }
      />

      {atLimit && (
        <Card className="mb-4 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You&apos;ve reached your plan&apos;s product limit.{" "}
          <a href="/dashboard/plan" className="font-medium underline">
            Upgrade your plan
          </a>{" "}
          to add more.
        </Card>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No products yet"
          description="Add your first product to start building your catalog."
          action={
            <Button href="/dashboard/products/new" leftIcon={<Plus className="h-4 w-4" />}>
              Add product
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Table header (desktop) */}
          <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-400 sm:grid">
            <span className="col-span-5">Product</span>
            <span className="col-span-2">Price</span>
            <span className="col-span-2">Stock</span>
            <span className="col-span-2">Moderation</span>
            <span className="col-span-1 text-right">Actions</span>
          </div>

          <ul className="divide-y divide-slate-100">
            {list.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-12 sm:items-center"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400">{p.category}</span>
                      <ProductStatusBadge status={p.status} />
                      {isBoosted(p) && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                          ★ Featured
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatCount(p.views)} views · {formatCount(p.whatsappClicks)} WhatsApp clicks
                    </p>
                  </div>
                </div>
                <div className="col-span-2 text-sm font-medium text-slate-700">
                  {formatPrice(p.price)}
                </div>
                <div className="col-span-2">
                  <StockBadge status={p.stockStatus} />
                </div>
                <div className="col-span-2">
                  <ModerationBadge status={p.moderationStatus} />
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  {isPaid && (
                    <button
                      onClick={() => setToBoost(p)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                      aria-label="Feature product"
                      title={isBoosted(p) ? "Extend featured" : "Feature this product"}
                    >
                      <Rocket className="h-4 w-4" />
                    </button>
                  )}
                  <Button
                    href={`/dashboard/products/${p.id}/edit`}
                    variant="ghost"
                    size="sm"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <button
                    onClick={() => setToDelete(p)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete product?"
        footer={
          <>
            <Button variant="outline" disabled={deleting} onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={async () => {
                if (!toDelete) return;
                try {
                  await deleteProduct(toDelete.id).unwrap();
                  dispatch(addToast(`Deleted "${toDelete.name}"`, "success"));
                  setToDelete(null);
                } catch (err) {
                  dispatch(addToast(getErrorMessage(err, "Could not delete"), "error"));
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <span className="font-medium text-slate-900">{toDelete?.name}</span>? This action
          cannot be undone.
        </p>
      </Modal>

      <Modal
        open={!!toBoost}
        onClose={() => setToBoost(null)}
        title="Feature this product"
        footer={
          <>
            <Button variant="outline" disabled={boosting} onClick={() => setToBoost(null)}>
              Cancel
            </Button>
            <Button
              loading={boosting}
              leftIcon={<Rocket className="h-4 w-4" />}
              onClick={async () => {
                if (!toBoost) return;
                try {
                  await boostProduct({ id: toBoost.id, packageId: pkgId }).unwrap();
                  dispatch(addToast(`"${toBoost.name}" is now featured`, "success"));
                  setToBoost(null);
                } catch (err) {
                  dispatch(addToast(getErrorMessage(err, "Could not feature product"), "error"));
                }
              }}
            >
              Feature now
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Featured products appear <span className="font-medium">first</span> in search and store
            listings with a ★ Featured tag. Choose a duration:
          </p>
          <div className="space-y-2">
            {BOOST_PACKAGES.map((pkg) => (
              <label
                key={pkg.id}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm transition-colors has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="boost"
                    checked={pkgId === pkg.id}
                    onChange={() => setPkgId(pkg.id)}
                  />
                  Featured for {pkg.label}
                </span>
                <span className="font-semibold text-slate-900">{formatPrice(pkg.price)}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
