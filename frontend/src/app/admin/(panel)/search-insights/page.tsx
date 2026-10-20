"use client";

import { useState } from "react";
import { ExternalLink, Search, SearchX, Tags } from "lucide-react";
import { Button, Card, CardBody, CardHeader, StatCardSkeleton, TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/domain/StatCard";
import { useGetSearchInsightsQuery } from "@/store/apiSlice";
import { cn, formatCount } from "@/lib/utils";

type Range = "7" | "30" | "all";
const RANGES: { value: Range; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

const when = (iso: string) => new Date(iso).toLocaleString("en-PK");

/** Simple ranked list used by each insights card. */
function RankedList({ empty, children }: { empty: string; children: React.ReactNode[] }) {
  return children.length === 0 ? (
    <p className="py-6 text-center text-sm text-slate-400">{empty}</p>
  ) : (
    <ol className="divide-y divide-slate-100">{children}</ol>
  );
}

export default function AdminSearchInsightsPage() {
  const [range, setRange] = useState<Range>("30");
  const { data, isLoading, isFetching } = useGetSearchInsightsQuery(range, { refetchOnMountOrArgChange: true });

  return (
    <>
      <PageHeader
        title="Search Insights"
        description="What shoppers type into search, what they can't find, and which products they find most."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <Button
            key={r.value}
            size="sm"
            variant={range === r.value ? "primary" : "outline"}
            onClick={() => setRange(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {isLoading || !data ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <TableSkeleton />
        </>
      ) : (
        <div className={cn(isFetching && "opacity-60 transition-opacity")}>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Searches" value={formatCount(data.totals.searches)} icon={<Search className="h-5 w-5" />} />
            <StatCard
              label="Different terms"
              value={formatCount(data.totals.uniqueTerms)}
              icon={<Tags className="h-5 w-5" />}
              tone="accent"
            />
            <StatCard
              label="Searches with no results"
              value={formatCount(data.totals.zeroResultSearches)}
              hint="Demand you don't have listings for yet"
              icon={<SearchX className="h-5 w-5" />}
              tone="gold"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Top searches" subtitle="Most searched terms" />
              <CardBody>
                <RankedList empty="No searches yet.">
                  {data.topTerms.map((t, i) => (
                    <li key={t.query} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className="w-5 text-right text-slate-400">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-800">{t.query}</p>
                        <p className="text-xs text-slate-400">
                          ~{formatCount(t.avgResults)} results · last {when(t.lastSearched)}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-900">{formatCount(t.count)}×</span>
                    </li>
                  ))}
                </RankedList>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Searches with no results" subtitle="Shoppers looked for these and found nothing" />
              <CardBody>
                <RankedList empty="Every search found something. 🎉">
                  {data.zeroResultTerms.map((t, i) => (
                    <li key={t.query} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className="w-5 text-right text-slate-400">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-800">{t.query}</p>
                        <p className="text-xs text-slate-400">last {when(t.lastSearched)}</p>
                      </div>
                      <span className="font-semibold text-amber-700">{formatCount(t.count)}×</span>
                    </li>
                  ))}
                </RankedList>
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="Most searched products" subtitle="How many searches returned each product" />
              <CardBody>
                <RankedList empty="No products have appeared in a search yet.">
                  {data.topProducts.map((p, i) => (
                    <li key={p.productId} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className="w-5 text-right text-slate-400">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.storeName}</p>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {formatCount(p.searches)} search{p.searches === 1 ? "" : "es"}
                      </span>
                      {p.storeSlug && (
                        <Button
                          href={`/store/${p.storeSlug}/product/${p.productId}`}
                          target="_blank"
                          variant="ghost"
                          size="sm"
                          leftIcon={<ExternalLink className="h-4 w-4" />}
                        >
                          View
                        </Button>
                      )}
                    </li>
                  ))}
                </RankedList>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
