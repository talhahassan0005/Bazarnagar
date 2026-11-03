"use client";

import { Package, ShieldAlert, Store as StoreIcon, Users } from "lucide-react";
import { Card, CardBody, CardHeader, BrandLoader, Button } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/domain/StatCard";
import { ModerationBadge } from "@/components/domain/StatusBadges";
import {
  useGetAllSellersQuery,
  useGetAllStoresQuery,
  useGetAllProductsQuery,
} from "@/store/apiSlice";
import { formatCount, formatPrice } from "@/lib/utils";

// Brand palette from Logo.tsx
const C = {
  navy:   "#1b3a5b",
  orange: "#e85d2c",
  amber:  "#f5a623",
  green:  "#1f6b2e",
  slate:  "#94a3b8",
  teal:   "#0d9488",
};

// ── Donut chart ────────────────────────────────────────────────────────────────
function DonutChart({
  slices,
  size = 140,
  centerLabel,
  centerSub,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0)
    return <div className="flex h-36 items-center justify-center text-xs text-slate-400">No data</div>;

  const r = 50;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const GAP = 3;
  let accumulated = 0;
  const arcs = slices.map((s) => {
    const dash = Math.max((s.value / total) * circumference - GAP, 0);
    const arc = { ...s, dash, offset: accumulated };
    accumulated += (s.value / total) * circumference;
    return arc;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={22} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={22}
          strokeLinecap="butt"
          strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
          strokeDashoffset={circumference / 4 - arc.offset}
        />
      ))}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize={22} fontWeight={700} fill="#0f172a">
        {centerLabel ?? total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#94a3b8">
        {centerSub ?? "total"}
      </text>
    </svg>
  );
}

// ── Horizontal bar chart ───────────────────────────────────────────────────────
function HBarChart({ rows, color }: { rows: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="max-w-[160px] truncate font-medium text-slate-700">{row.label}</span>
            <span className="ml-2 tabular-nums text-slate-500">{formatCount(row.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(row.value / max) * 100}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Grouped bar chart (views vs clicks per store) ──────────────────────────────
function GroupedBarChart({ stores }: { stores: { name: string; views: number; clicks: number }[] }) {
  const maxVal = Math.max(...stores.flatMap((s) => [s.views, s.clicks]), 1);
  const BAR_H = 10;
  const GAP = 3;
  const ROW_H = BAR_H * 2 + GAP + 20; // two bars + gap + label
  const W = 340;
  const labelW = 110;
  const barW = W - labelW - 8;

  return (
    <div className="space-y-1">
      {/* legend */}
      <div className="mb-3 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm" style={{ background: C.navy }} />
          Views
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm" style={{ background: C.green }} />
          WA clicks
        </span>
      </div>
      {stores.map((s) => (
        <div key={s.name} className="flex items-center gap-2">
          <span className="w-28 shrink-0 truncate text-xs text-slate-600">{s.name}</span>
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <div className="h-2 rounded-sm" style={{ width: `${(s.views / maxVal) * 100}%`, background: C.navy, minWidth: 2 }} />
              <span className="text-[10px] text-slate-400">{s.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 rounded-sm" style={{ width: `${(s.clicks / maxVal) * 100}%`, background: C.green, minWidth: 2 }} />
              <span className="text-[10px] text-slate-400">{s.clicks}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminOverviewPage() {
  const sellers = useGetAllSellersQuery();
  const stores  = useGetAllStoresQuery();
  const products = useGetAllProductsQuery();

  const allProducts = products.data ?? [];
  const allStores   = stores.data   ?? [];
  const allSellers  = sellers.data  ?? [];
  const loading = sellers.isLoading || stores.isLoading || products.isLoading;

  const needsReview  = allProducts.filter((p) => p.moderationStatus === "pending" || p.moderationStatus === "flagged");
  const totalViews   = allStores.reduce((s, st) => s + st.views, 0);
  const totalClicks  = allStores.reduce((s, st) => s + st.whatsappClicks, 0);

  const modSlices = [
    { label: "Approved", value: allProducts.filter((p) => p.moderationStatus === "approved").length, color: C.green  },
    { label: "Pending",  value: allProducts.filter((p) => p.moderationStatus === "pending").length,  color: C.amber  },
    { label: "Flagged",  value: allProducts.filter((p) => p.moderationStatus === "flagged").length,  color: C.orange },
    { label: "Rejected", value: allProducts.filter((p) => p.moderationStatus === "rejected").length, color: C.slate  },
  ].filter((s) => s.value > 0);

  const sellerSlices = [
    { label: "Active",    value: allSellers.filter((s) => s.status === "active").length,    color: C.navy   },
    { label: "Pending",   value: allSellers.filter((s) => s.status === "pending").length,   color: C.amber  },
    { label: "Suspended", value: allSellers.filter((s) => s.status === "suspended").length, color: C.orange },
    { label: "Inactive",  value: allSellers.filter((s) => s.status === "inactive").length,  color: C.slate  },
  ].filter((s) => s.value > 0);

  const storeSlices = [
    { label: "Active",   value: allStores.filter((s) => s.status === "active").length,   color: C.green  },
    { label: "Inactive", value: allStores.filter((s) => s.status === "inactive").length, color: C.slate  },
    { label: "Pending",  value: allStores.filter((s) => s.status === "pending").length,  color: C.amber  },
  ].filter((s) => s.value > 0);

  const topStores = [...allStores]
    .sort((a, b) => b.views - a.views)
    .slice(0, 7)
    .map((s) => ({ name: s.name, views: s.views, clicks: s.whatsappClicks }));

  return (
    <>
      <PageHeader title="Overview" description="Platform-wide activity and moderation queue." />

      {loading ? (
        <BrandLoader label="Loading dashboard…" />
      ) : (
        <>
          {/* ── Stat cards — ONE row only ──────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Sellers"      value={allSellers.length}  icon={<Users className="h-5 w-5" />} />
            <StatCard label="Stores"       value={allStores.length}   icon={<StoreIcon className="h-5 w-5" />} tone="accent" />
            <StatCard label="Products"     value={allProducts.length} icon={<Package className="h-5 w-5" />} tone="leaf" />
            <StatCard label="Needs review" value={needsReview.length} icon={<ShieldAlert className="h-5 w-5" />} tone="gold" />
          </div>

          {/* ── Charts row 1: three donuts ─────────────────────────────────── */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Product moderation donut */}
            <Card>
              <CardHeader title="Products" subtitle="Moderation status" />
              <CardBody className="flex flex-col items-center gap-3">
                <DonutChart slices={modSlices} centerSub="products" />
                <div className="flex w-full flex-wrap justify-center gap-x-5 gap-y-1.5">
                  {modSlices.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      {s.label} <span className="font-semibold text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Seller status donut */}
            <Card>
              <CardHeader title="Sellers" subtitle="Account status" />
              <CardBody className="flex flex-col items-center gap-3">
                <DonutChart slices={sellerSlices} centerSub="sellers" />
                <div className="flex w-full flex-wrap justify-center gap-x-5 gap-y-1.5">
                  {sellerSlices.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      {s.label} <span className="font-semibold text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Store status donut */}
            <Card>
              <CardHeader title="Stores" subtitle="Store status" />
              <CardBody className="flex flex-col items-center gap-3">
                <DonutChart slices={storeSlices} centerSub="stores" />
                <div className="flex w-full flex-wrap justify-center gap-x-5 gap-y-1.5">
                  {storeSlices.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      {s.label} <span className="font-semibold text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* ── Charts row 2: views + clicks grouped bar ───────────────────── */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Store activity"
                subtitle={`${formatCount(totalViews)} views · ${formatCount(totalClicks)} WA clicks`}
              />
              <CardBody>
                {topStores.length === 0
                  ? <p className="py-6 text-center text-xs text-slate-400">No data yet</p>
                  : <GroupedBarChart stores={topStores} />
                }
              </CardBody>
            </Card>

            <div className="grid grid-rows-2 gap-4">
              <Card>
                <CardHeader title="Top by views" subtitle="Most visited stores" />
                <CardBody>
                  {topStores.length === 0
                    ? <p className="py-4 text-center text-xs text-slate-400">No data</p>
                    : <HBarChart rows={topStores.slice(0, 4).map((s) => ({ label: s.name, value: s.views }))} color={C.navy} />
                  }
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Top by WhatsApp" subtitle="Most inquiries" />
                <CardBody>
                  {topStores.length === 0
                    ? <p className="py-4 text-center text-xs text-slate-400">No data</p>
                    : <HBarChart rows={[...topStores].sort((a,b) => b.clicks-a.clicks).slice(0,4).map((s) => ({ label: s.name, value: s.clicks }))} color={C.green} />
                  }
                </CardBody>
              </Card>
            </div>
          </div>

          {/* ── Moderation queue ───────────────────────────────────────────── */}
          <Card className="mt-4">
            <CardHeader
              title="Moderation queue"
              subtitle="Products pending review or flagged"
              action={<Button href="/admin/moderation" variant="ghost" size="sm">Open queue</Button>}
            />
            <CardBody className="space-y-2">
              {needsReview.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Nothing to review — all caught up! 🎉</p>
              ) : (
                needsReview.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5">
                    <img src={p.images[0]} alt={p.name} className="h-11 w-11 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.store.name} · {formatPrice(p.price)}</p>
                    </div>
                    <ModerationBadge status={p.moderationStatus} />
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
