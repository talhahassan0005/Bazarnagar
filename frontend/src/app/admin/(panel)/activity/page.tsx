"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Badge, Button, TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { useGetActivityLogsQuery } from "@/store/apiSlice";
import { cn, formatPrice } from "@/lib/utils";
import type { ActivityLog, ActivityType } from "@/lib/types";

const FILTERS: { label: string; value?: ActivityType }[] = [
  { label: "All" },
  { label: "Stores created", value: "store.created" },
  { label: "Products added", value: "product.created" },
];

export default function AdminActivityPage() {
  const [type, setType] = useState<ActivityType | undefined>();
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetActivityLogsQuery(
    { type, page },
    { refetchOnMountOrArgChange: true }
  );

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
      />

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
            empty={<p className="py-10 text-center text-sm text-slate-400">No activity yet.</p>}
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
