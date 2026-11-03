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

// ── Donut chart ────────────────────────────────────────────────────────────────
function DonutChart({ slices, size = 120 }: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return (
    <div className="flex h-[120px] items-center justify-center text-xs text-slate-400">No data</div>
  );
  const r = 40;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const arcs = slices.map((s) => {
    const pct = s.value / total;
    const dash = pct * circumference;
    const arc = { ...s, dash, offset, pct };
    offset += dash;
    return arc;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={18} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={18}
          strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
          strokeDashoffset={-arc.offset}
          strokeLinecap="butt"
          style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="text-lg font-bold" fontSize={20} fontWeight={700} fill="#1e293b">
        {total}
      </text>
    </svg>
  );
}

// ── Horizontal bar chart ───────────────────────────────────────────────────────
function HBarChart({ rows, color = "#6366f1" }: {
  rows: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="truncate font-medium text-slate-700 max-w-[140px]">{row.label}</span>
            <span className="ml-2 text-slate-400">{formatCount(row.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(row.value / max) * 100}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminOverviewPage() {
  const sellers = useGetAllSellersQuery();
  const stores = useGetAllStoresQuery();
  const products = useGetAllProductsQuery();

  const allProducts = products.data ?? [];
  const allStores = stores.data ?? [];
  const allSellers = sellers.data ?? [];
  const loading = sellers.isLoading || stores.isLoading || products.isLoading;

  const needsReview = allProducts.filter(
    (p) => p.moderationStatus === "pending" || p.moderationStatus === "flagged"
  );
  const totalViews = allStores.reduce((s, st) => s + st.views, 0);
  const totalClicks = allStores.reduce((s, st) => s + st.whatsappClicks, 0);

  // chart data
  const modSlices = [
    { label: "Approved", value: allProducts.filter((p) => p.moderationStatus === "approved").length, color: "#22c55e" },
    { label: "Pending", value: allProducts.filter((p) => p.moderationStatus === "pending").length, color: "#f59e0b" },
    { label: "Flagged", value: allProducts.filter((p) => p.moderationStatus === "flagged").length, color: "#ef4444" },
    { label: "Rejected", value: allProducts.filter((p) => p.moderationStatus === "rejected").length, color: "#94a3b8" },
  ].filter((s) => s.value > 0);

  const sellerSlices = [
    { label: "Active", value: allSellers.filter((s) => s.status === "active").length, color: "#6366f1" },
    { label: "Pending", value: allSellers.filter((s) => s.status === "pending").length, color: "#f59e0b" },
    { label: "Suspended", value: allSellers.filter((s) => s.status === "suspended").length, color: "#ef4444" },
    { label: "Inactive", value: allSellers.filter((s) => s.status === "inactive").length, color: "#94a3b8" },
  ].filter((s) => s.value > 0);

  const topStoresByViews = [...allStores]
    .sort((a, b) => b.views - a.views)
    .slice(0, 6)
    .map((s) => ({ label: s.name, value: s.views }));

  const topStoresByClicks = [...allStores]
    .sort((a, b) => b.whatsappClicks - a.whatsappClicks)
    .slice(0, 6)
    .map((s) => ({ label: s.name, value: s.whatsappClicks }));

  return (
    <>
      <PageHeader title="Overview" description="Platform-wide activity and moderation queue." />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Sellers" value={allSellers.length} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Stores" value={allStores.length} icon={<StoreIcon className="h-5 w-5" />} tone="accent" />
          <StatCard label="Products" value={allProducts.length} icon={<Package className="h-5 w-5" />} tone="leaf" />
          <StatCard label="Needs review" value={needsReview.length} icon={<ShieldAlert className="h-5 w-5" />} tone="gold" />
        </div>
      )}

      {loading ? (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <StatCard label="Total shop views" value={formatCount(totalViews)} icon={<Eye className="h-5 w-5" />} />
          <StatCard label="Total WhatsApp clicks" value={formatCount(totalClicks)} icon={<MessageCircle className="h-5 w-5" />} tone="brand" />
        </div>
      )}

      {/* ── Charts row ─────────────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Product moderation breakdown */}
        <Card>
          <CardHeader title="Product moderation" subtitle="Status breakdown" />
          <CardBody className="flex flex-col items-center gap-4">
            {loading ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <Skeleton className="h-[120px] w-[120px] rounded-full" />
                <div className="flex gap-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-4 w-16 rounded" />)}
                </div>
              </div>
            ) : (
              <>
                <DonutChart slices={modSlices} />
                <div className="flex w-full flex-wrap justify-center gap-x-4 gap-y-1.5">
                  {modSlices.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      {s.label} <span className="font-semibold text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Seller status breakdown */}
        <Card>
          <CardHeader title="Seller accounts" subtitle="Status breakdown" />
          <CardBody className="flex flex-col items-center gap-4">
            {loading ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <Skeleton className="h-[120px] w-[120px] rounded-full" />
                <div className="flex gap-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-4 w-16 rounded" />)}
                </div>
              </div>
            ) : (
              <>
                <DonutChart slices={sellerSlices} />
                <div className="flex w-full flex-wrap justify-center gap-x-4 gap-y-1.5">
                  {sellerSlices.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      {s.label} <span className="font-semibold text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Top stores by views */}
        <Card>
          <CardHeader title="Top stores" subtitle="By shop views" />
          <CardBody>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-7 w-full rounded" />)}
              </div>
            ) : topStoresByViews.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No data yet</p>
            ) : (
              <HBarChart rows={topStoresByViews} color="#6366f1" />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Top stores by WhatsApp clicks */}
      <Card className="mt-4">
        <CardHeader title="Top stores by WhatsApp clicks" subtitle="Most buyer inquiries" />
        <CardBody>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-7 w-full rounded" />)}
            </div>
          ) : topStoresByClicks.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No data yet</p>
          ) : (
            <HBarChart rows={topStoresByClicks} color="#10b981" />
          )}
        </CardBody>
      </Card>

      {/* Moderation queue */}
      <Card className="mt-4">
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
          {loading ? (
            <ListRowsSkeleton rows={3} />
          ) : needsReview.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Nothing to review — all caught up! 🎉
            </p>
          ) : (
            needsReview.slice(0, 5).map((p) => (
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
            ))
          )}
        </CardBody>
      </Card>
    </>
  );
}
