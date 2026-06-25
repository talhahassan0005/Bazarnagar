"use client";

import {
  Eye,
  MessageCircle,
  Package,
  ShieldAlert,
  Store as StoreIcon,
  Users,
} from "lucide-react";
import {
  Card,
  CardBody,
  CardHeader,
  StatCardSkeleton,
  ListRowsSkeleton,
  Skeleton,
  Button,
} from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/domain/StatCard";
import { ModerationBadge } from "@/components/domain/StatusBadges";
import {
  useGetAllSellersQuery,
  useGetAllStoresQuery,
  useGetAllProductsQuery,
} from "@/store/apiSlice";
import { formatCount, formatPrice } from "@/lib/utils";

export default function AdminOverviewPage() {
  const sellers = useGetAllSellersQuery();
  const stores = useGetAllStoresQuery();
  const products = useGetAllProductsQuery();

  if (sellers.isLoading || stores.isLoading || products.isLoading) {
    return (
      <>
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <Card className="mt-6 p-4">
          <ListRowsSkeleton rows={5} />
        </Card>
      </>
    );
  }

  const allProducts = products.data ?? [];
  const allStores = stores.data ?? [];
  const needsReview = allProducts.filter(
    (p) => p.moderationStatus === "pending" || p.moderationStatus === "flagged"
  );
  const totalViews = allStores.reduce((s, st) => s + st.views, 0);
  const totalClicks = allStores.reduce((s, st) => s + st.whatsappClicks, 0);

  return (
    <>
      <PageHeader title="Overview" description="Platform-wide activity and moderation queue." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Sellers" value={sellers.data?.length ?? 0} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Stores" value={allStores.length} icon={<StoreIcon className="h-5 w-5" />} tone="accent" />
        <StatCard label="Products" value={allProducts.length} icon={<Package className="h-5 w-5" />} tone="leaf" />
        <StatCard
          label="Needs review"
          value={needsReview.length}
          icon={<ShieldAlert className="h-5 w-5" />}
          tone="gold"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <StatCard label="Total shop views" value={formatCount(totalViews)} icon={<Eye className="h-5 w-5" />} />
        <StatCard
          label="Total WhatsApp clicks"
          value={formatCount(totalClicks)}
          icon={<MessageCircle className="h-5 w-5" />}
          tone="brand"
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Moderation queue"
          subtitle="Products pending review or flagged"
          action={
            <Button href="/admin/moderation" variant="ghost" size="sm">
              Open queue
            </Button>
          }
        />
        <CardBody className="space-y-2">
          {needsReview.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              Nothing to review — all caught up! 🎉
            </p>
          )}
          {needsReview.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5">
              <img src={p.images[0]} alt={p.name} className="h-11 w-11 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-400">
                  {p.store.name} · {formatPrice(p.price)}
                </p>
              </div>
              <ModerationBadge status={p.moderationStatus} />
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  );
}
