"use client";

import { Eye, MessageCircle, PackageX, Pencil, Plus, TrendingUp } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  StatCardSkeleton,
  ListRowsSkeleton,
  Skeleton,
} from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StatCard, PlanUsageBar } from "@/components/domain/StatCard";
import { CopyLink } from "@/components/domain/CopyLink";
import { ModerationBadge, StockBadge } from "@/components/domain/StatusBadges";
import { useAppSelector } from "@/store/hooks";
import {
  useGetDashboardMetricsQuery,
  useGetMyStoreQuery,
  useGetMyProductsQuery,
} from "@/store/apiSlice";
import { SITE_DOMAIN } from "@/lib/constants";
import { formatCount, formatPrice } from "@/lib/utils";

export default function DashboardPage() {
  const sellerId = useAppSelector((s) => s.auth.sellerId) ?? undefined;
  const metrics = useGetDashboardMetricsQuery(sellerId);
  const store = useGetMyStoreQuery(sellerId);
  const products = useGetMyProductsQuery(sellerId);

  if (metrics.isLoading || store.isLoading || products.isLoading || !store.data) {
    return (
      <>
        <Skeleton className="mb-6 h-8 w-56" />
        <Skeleton className="mb-6 h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl" />
          <div className="lg:col-span-2">
            <Card className="p-4">
              <ListRowsSkeleton />
            </Card>
          </div>
        </div>
      </>
    );
  }

  const m = metrics.data!;
  const s = store.data!;
  const storeUrl = `${SITE_DOMAIN}/store/${s.slug}`;
  const recent = (products.data ?? []).slice(0, 4);

  return (
    <>
      <PageHeader
        title={`Hi, ${s.name} 👋`}
        description="Here's how your shop is performing."
        action={
          <Button href="/dashboard/products/new" leftIcon={<Plus className="h-4 w-4" />}>
            Add product
          </Button>
        }
      />

      {/* Store link */}
      <Card className="mb-6">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Your public store link</p>
            <p className="text-xs text-slate-400">Share this anywhere — customers need no login.</p>
          </div>
          <div className="flex flex-1 items-center gap-2 sm:max-w-md">
            <CopyLink value={storeUrl} className="flex-1" />
            <Button href={`/store/${s.slug}`} variant="outline" target="_blank">
              Preview
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Shop views"
          value={formatCount(m.shopViews)}
          icon={<Eye className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Product views"
          value={formatCount(m.productViews)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="accent"
        />
        <StatCard
          label="WhatsApp clicks"
          value={formatCount(m.whatsappClicks)}
          icon={<MessageCircle className="h-5 w-5" />}
          tone="leaf"
        />
        <StatCard
          label="Out of stock"
          value={m.outOfStockProducts}
          icon={<PackageX className="h-5 w-5" />}
          tone="gold"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Plan usage */}
        <Card>
          <CardHeader title="Plan usage" subtitle="Active products against your limit" />
          <CardBody className="space-y-4">
            <PlanUsageBar used={m.productsUsed} limit={m.productLimit} />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 py-3">
                <p className="text-lg font-bold text-slate-900">{m.totalProducts}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
              <div className="rounded-xl bg-slate-50 py-3">
                <p className="text-lg font-bold text-emerald-600">{m.activeProducts}</p>
                <p className="text-xs text-slate-400">Active</p>
              </div>
              <div className="rounded-xl bg-slate-50 py-3">
                <p className="text-lg font-bold text-amber-600">{m.outOfStockProducts}</p>
                <p className="text-xs text-slate-400">Out</p>
              </div>
            </div>
            <Button href="/dashboard/plan" variant="outline" fullWidth>
              Manage plan
            </Button>
          </CardBody>
        </Card>

        {/* Recent products */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent products"
            action={
              <Button href="/dashboard/products" variant="ghost" size="sm">
                View all
              </Button>
            }
          />
          <CardBody className="space-y-2">
            {recent.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">No products yet.</p>
            )}
            {recent.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5"
              >
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                  <p className="text-sm text-slate-500">{formatPrice(p.price)}</p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <StockBadge status={p.stockStatus} />
                  <ModerationBadge status={p.moderationStatus} />
                </div>
                <Button
                  href={`/dashboard/products/${p.id}/edit`}
                  variant="ghost"
                  size="sm"
                  leftIcon={<Pencil className="h-4 w-4" />}
                >
                  Edit
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
