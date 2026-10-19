"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Search, X } from "lucide-react";
import { Badge, Button, Input, TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { useGetActivityLogsQuery } from "@/store/apiSlice";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { downloadFile } from "@/lib/api";
import { cn, formatPrice, getErrorMessage } from "@/lib/utils";
import type { ActivityLog, ActivityLogFilters, ActivityType } from "@/lib/types";

const FILTERS: { label: string; value?: ActivityType }[] = [
  { label: "All" },
  { label: "Stores created", value: "store.created" },
  { label: "Products added", value: "product.created" },
];

/** "YYYY-MM-DD" from a date input → ISO bound of that day in the admin's timezone. */
function dayBound(date: string, end: boolean): string | undefined {
  if (!date) return undefined;
  return new Date(`${date}T${end ? "23:59:59.999" : "00:00:00"}`).toISOString();
}

export default function AdminActivityPage() {
  const dispatch = useAppDispatch();
  const [type, setType] = useState<ActivityType | undefined>();
  const [page, setPage] = useState(1);
  // Search box text vs. the search actually applied (on Enter / Search).
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [downloading, setDownloading] = useState(false);

  const filters: ActivityLogFilters = {
    type,
    q: q || undefined,
    from: dayBound(fromDate, false),
    to: dayBound(toDate, true),
  };
  const hasFilters = Boolean(q || fromDate || toDate);
  const invalidRange = Boolean(fromDate && toDate && fromDate > toDate);

  const { data, isLoading, isFetching } = useGetActivityLogsQuery(
    { ...filters, page },
    { refetchOnMountOrArgChange: true, skip: invalidRange }
  );

  function clearFilters() {
    setSearchInput("");
    setQ("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  async function downloadCsv() {
    setDownloading(true);
    try {
      await downloadFile(
        "/admin/activity/export",
        { ...filters },
        "bazaarnagar-activity.csv"
      );
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not download the CSV"), "error"));
    } finally {
      setDownloading(false);
    }
  }

  const columns: Column<ActivityLog>[] = [
    {
      header: "When",
      cell: (l) => (
        <span className="whitespace-nowrap text-slate-600">
          {new Date(l.createdAt).toLocaleString("en-PK")}
        </span>
      ),
    },
    {
      header: "Event",
      cell: (l) =>
        l.type === "store.created" ? (
          <Badge tone="blue">Store created</Badge>
        ) : (
          <Badge tone="green">Product added</Badge>
        ),
    },
    {
      header: "Details",
      cell: (l) => (
        <div>
          <p className="font-medium text-slate-800">
            {l.type === "product.created" ? l.snapshot.productName : l.snapshot.storeName}
          </p>
          <p className="text-xs text-slate-400">
            {l.type === "product.created"
              ? [l.snapshot.storeName, l.snapshot.category].filter(Boolean).join(" · ")
              : [l.snapshot.category, l.snapshot.city].filter(Boolean).join(" · ")}
          </p>
        </div>
      ),
    },
    {
      header: "Price",
      hideOnMobile: true,
      cell: (l) => (l.snapshot.price != null ? formatPrice(l.snapshot.price) : "—"),
    },
    {
      header: "Seller",
      hideOnMobile: true,
      cell: (l) => (
        <div>
          <p className="text-slate-700">{l.snapshot.sellerName ?? "—"}</p>
          <p className="text-xs text-slate-400">{l.snapshot.sellerEmail}</p>
        </div>
      ),
    },
    {
      header: "",
      className: "text-right",
      cell: (l) =>
        l.snapshot.storeSlug ? (
          <Button
            href={
              l.type === "product.created" && l.productId
                ? `/store/${l.snapshot.storeSlug}/product/${l.productId}`
                : `/store/${l.snapshot.storeSlug}`
            }
            target="_blank"
            variant="ghost"
            size="sm"
            leftIcon={<ExternalLink className="h-4 w-4" />}
          >
            View
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Activity Log"
        description="Every store created and product added on the platform, newest first."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCsv}
            loading={downloading}
            disabled={invalidRange || data?.total === 0}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Download CSV
          </Button>
        }
      />

      {/* Search + date range. The CSV download uses the same filters. */}
      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(searchInput.trim());
            setPage(1);
          }}
        >
          <div className="min-w-0 flex-1">
            <Input
              label="Search"
              placeholder="Seller, email, store, product, city…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" className="self-end" aria-label="Search" leftIcon={<Search className="h-4 w-4" />}>
            Search
          </Button>
        </form>
        <Input
          type="date"
          label="From"
          value={fromDate}
          max={toDate || undefined}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          label="To"
          value={toDate}
          min={fromDate || undefined}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(1);
          }}
          error={invalidRange ? "Must be after From" : undefined}
        />
        <Button
          variant="ghost"
          onClick={clearFilters}
          disabled={!hasFilters}
          leftIcon={<X className="h-4 w-4" />}
        >
          Clear
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.label}
            size="sm"
            variant={type === f.value ? "primary" : "outline"}
            onClick={() => {
              setType(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className={cn(isFetching && "opacity-60 transition-opacity")}>
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            empty={
              <p className="py-10 text-center text-sm text-slate-400">
                {hasFilters ? "No activity matches your search or dates." : "No activity yet."}
              </p>
            }
          />
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {data.page} of {data.pages} · {data.total} entries
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
    </>
  );
}
