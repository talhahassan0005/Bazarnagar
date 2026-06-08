"use client";

import { Eye, MessageCircle, TrendingUp } from "lucide-react";
import { Card, CardBody, CardHeader, StatCardSkeleton, Skeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/domain/StatCard";
import { useAppSelector } from "@/store/hooks";
import { useGetDashboardMetricsQuery, useGetMyProductsQuery } from "@/store/apiSlice";
import { formatCount } from "@/lib/utils";

export default function AnalyticsPage() {
  const sellerId = useAppSelector((s) => s.auth.sellerId) ?? undefined;
  const metrics = useGetDashboardMetricsQuery(sellerId);
  const products = useGetMyProductsQuery(sellerId);

  if (metrics.isLoading || products.isLoading) {
    return (
      <>
        <Skeleton className="mb-6 h-8 w-44" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="mt-6 h-72 rounded-2xl" />
      </>
    );
  }

  const m = metrics.data!;
  const rows = [...(products.data ?? [])].sort((a, b) => b.views - a.views);
  const maxViews = Math.max(1, ...rows.map((p) => p.views));

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Shop views, product views and WhatsApp clicks."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Shop views"
          value={formatCount(m.shopViews)}
          hint="Public shop page opens"
          icon={<Eye className="h-5 w-5" />}
        />
        <StatCard
          label="Product views"
          value={formatCount(m.productViews)}
          hint="Across all products"
          tone="accent"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="WhatsApp clicks"
          value={formatCount(m.whatsappClicks)}
          hint="Inquiry button taps"
          tone="leaf"
          icon={<MessageCircle className="h-5 w-5" />}
        />
      </div>

      <Card className="mt-6">
        <CardHeader title="Top products by views" />
        <CardBody className="space-y-3">
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">No data yet.</p>
          )}
          {rows.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <img src={p.images[0]} alt={p.name} className="h-9 w-9 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-slate-700">{p.name}</p>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatCount(p.views)} views · {formatCount(p.whatsappClicks)} clicks
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(p.views / maxViews) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  );
}
