"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Search, SearchX, Tags } from "lucide-react";
import { Button, Card, CardBody, CardHeader, Input, StatCardSkeleton, TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/domain/StatCard";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { useGetSearchInsightsQuery, useGetSearchLogsQuery } from "@/store/apiSlice";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { downloadFile } from "@/lib/api";
import { cn, formatCount, getErrorMessage } from "@/lib/utils";
import type { SearchLogEntry } from "@/lib/types";

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

/** Every individual search with its time — filterable and downloadable as CSV. */
function SearchLogSection({ range }: { range: Range }) {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [downloading, setDownloading] = useState(false);
  const { data, isLoading, isFetching } = useGetSearchLogsQuery(
    { days: range, q: q || undefined, page },
    { refetchOnMountOrArgChange: true }
  );

  async function downloadCsv() {
    setDownloading(true);
    try {
      await downloadFile("/admin/search-logs/export", { days: range, q: q || undefined }, "bazaarnagar-searches.csv");
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not download the CSV"), "error"));
    } finally {
      setDownloading(false);
    }
  }

  const columns: Column<SearchLogEntry>[] = [
    {
      header: "When",
      cell: (l) => <span className="whitespace-nowrap text-slate-600">{when(l.createdAt)}</span>,
    },
    { header: "Keyword", cell: (l) => <span className="font-medium text-slate-800">{l.query}</span> },
    {
      header: "Filters",
      hideOnMobile: true,
      cell: (l) => [l.category, l.city].filter(Boolean).join(" · ") || <span className="text-slate-300">—</span>,
    },
    {
      header: "Results",
      className: "text-right",
      cell: (l) => (
        <span className={l.resultCount === 0 ? "font-semibold text-amber-700" : "text-slate-700"}>
          {formatCount(l.resultCount)}
        </span>
      ),
    },
  ];

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Search log</h2>
          <p className="text-sm text-slate-500">Every search with its time and keyword, newest first.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadCsv}
          loading={downloading}
          disabled={data?.total === 0}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Download CSV
        </Button>
      </div>

      <form
        className="mb-3 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input.trim());
          setPage(1);
        }}
      >
        <div className="min-w-0 flex-1">
          <Input placeholder="Filter by keyword…" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" leftIcon={<Search className="h-4 w-4" />}>
          Filter
        </Button>
      </form>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className={cn(isFetching && "opacity-60 transition-opacity")}>
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            empty={
              <p className="py-10 text-center text-sm text-slate-400">
                {q ? "No searches match that keyword." : "No searches in this period yet."}
              </p>
            }
          />
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {data.page} of {data.pages} · {formatCount(data.total)} searches
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
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

      {/* key resets paging/filter when the date range changes */}
      <SearchLogSection key={range} range={range} />
    </>
  );
}
