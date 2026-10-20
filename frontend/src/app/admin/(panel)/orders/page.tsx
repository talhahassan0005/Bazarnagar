"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList, Download, Eye, Search, Wallet, X } from "lucide-react";
import { Badge, Button, Input, Modal, StatCardSkeleton, TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { StatCard } from "@/components/domain/StatCard";
import { OrderStatusBadge } from "@/components/domain/StatusBadges";
import { LoadError } from "@/components/domain/LoadError";
import { useGetAdminOrdersQuery } from "@/store/apiSlice";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { downloadFile } from "@/lib/api";
import { cn, formatCount, formatPrice, getErrorMessage } from "@/lib/utils";
import type { AdminOrderFilters, AdminOrdersPage, OrderStatus } from "@/lib/types";

type AdminOrder = AdminOrdersPage["items"][number];

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const orderNo = (id: string) => `#${id.slice(-6).toUpperCase()}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-PK");

/** "YYYY-MM-DD" from a date input → ISO bound of that day in the admin's timezone. */
function dayBound(date: string, end: boolean): string | undefined {
  if (!date) return undefined;
  return new Date(`${date}T${end ? "23:59:59.999" : "00:00:00"}`).toISOString();
}

/** Full order details plus its status timeline. */
function OrderDetails({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  // Older orders have no history yet — show when they were placed at least.
  const history = order.statusHistory?.length
    ? order.statusHistory
    : [{ status: "pending" as OrderStatus, at: order.createdAt }];
  // Orders placed before subtotal/delivery were stored don't have them.
  const subtotal = order.subtotal ?? order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = order.deliveryFee ?? 0;

  return (
    <Modal open onClose={onClose} title={`Order ${orderNo(order.id)}`}>
      <div className="space-y-5 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <Badge tone={order.customerId ? "blue" : "gray"}>{order.customerId ? "Buyer account" : "Guest"}</Badge>
          <span className="text-slate-400">Placed {when(order.createdAt)}</span>
        </div>

        <div>
          <p className="mb-1 font-semibold text-slate-800">Shop</p>
          <p className="text-slate-600">{order.storeName}</p>
        </div>

        <div>
          <p className="mb-1 font-semibold text-slate-800">Buyer</p>
          <p className="text-slate-600">
            {order.customerName} · {order.customerPhone}
            {order.customerEmail && <> · {order.customerEmail}</>}
          </p>
          <p className="text-slate-500">
            {order.customerAddress}, {order.customerCity}
          </p>
          {order.note && <p className="mt-1 rounded-lg bg-slate-50 p-2 text-slate-600">Note: {order.note}</p>}
        </div>

        <div>
          <p className="mb-1 font-semibold text-slate-800">Items</p>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
            {order.items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3 px-3 py-2">
                <span className="text-slate-700">
                  {i.name} <span className="text-slate-400">× {i.quantity}</span>
                </span>
                <span className="text-slate-700">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 space-y-0.5 text-right text-slate-500">
            <p>Subtotal {formatPrice(subtotal)}</p>
            <p>Delivery {deliveryFee ? formatPrice(deliveryFee) : "Free"}</p>
            <p className="text-base font-bold text-slate-900">Total {formatPrice(order.total)}</p>
            <p className="text-xs">{order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 font-semibold text-slate-800">Status history</p>
          <ol className="relative space-y-3 border-l border-slate-200 pl-4">
            {history.map((h, i) => (
              <li key={`${h.status}-${i}`} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white" />
                <p className="font-medium capitalize text-slate-700">{h.status === "pending" ? "Placed" : h.status}</p>
                <p className="text-xs text-slate-400">{when(h.at)}</p>
              </li>
            ))}
          </ol>
          {!order.statusHistory?.length && (
            <p className="mt-2 text-xs text-slate-400">
              This order was placed before status history was recorded.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function AdminOrdersPage() {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewing, setViewing] = useState<AdminOrder | null>(null);
  const [downloading, setDownloading] = useState(false);

  const filters: AdminOrderFilters = {
    status,
    q: q || undefined,
    from: dayBound(fromDate, false),
    to: dayBound(toDate, true),
  };
  const invalidRange = Boolean(fromDate && toDate && fromDate > toDate);
  const hasFilters = Boolean(q || fromDate || toDate);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminOrdersQuery(
    { ...filters, page },
    { refetchOnMountOrArgChange: true, skip: invalidRange }
  );

  async function downloadCsv() {
    setDownloading(true);
    try {
      await downloadFile("/admin/orders/export", { ...filters }, "bazaarnagar-orders.csv");
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not download the CSV"), "error"));
    } finally {
      setDownloading(false);
    }
  }

  function clearFilters() {
    setInput("");
    setQ("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  const counts = data?.summary.byStatus;
  const allCount = counts ? Object.values(counts).reduce((s, n) => s + n, 0) : 0;

  const columns: Column<AdminOrder>[] = [
    {
      header: "Order",
      cell: (o) => (
        <div>
          <p className="font-mono font-medium text-slate-800">{orderNo(o.id)}</p>
          <p className="whitespace-nowrap text-xs text-slate-400">{when(o.createdAt)}</p>
        </div>
      ),
    },
    { header: "Shop", hideOnMobile: true, cell: (o) => o.storeName },
    {
      header: "Buyer",
      cell: (o) => (
        <div>
          <p className="text-slate-800">{o.customerName}</p>
          <p className="text-xs text-slate-400">
            {o.customerPhone} · {o.customerCity} · {o.customerId ? "Account" : "Guest"}
          </p>
        </div>
      ),
    },
    {
      header: "Items",
      hideOnMobile: true,
      cell: (o) => (
        <p className="max-w-[220px] truncate text-slate-600" title={o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}>
          {o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}
        </p>
      ),
    },
    { header: "Total", cell: (o) => <span className="font-semibold text-slate-900">{formatPrice(o.total)}</span> },
    { header: "Status", cell: (o) => <OrderStatusBadge status={o.status} /> },
    {
      header: "Action",
      className: "text-right",
      cell: (o) => (
        <Button variant="ghost" size="sm" onClick={() => setViewing(o)} leftIcon={<Eye className="h-4 w-4" />}>
          View
        </Button>
      ),
    },
  ];

  if (isError) {
    return (
      <>
        <PageHeader title="Orders" description="Every order placed on the platform, with buyer, shop and status history." />
        <LoadError what="orders" error={error} onRetry={refetch} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every order placed on the platform, with buyer, shop and status history."
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

      {isLoading || !data ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <TableSkeleton />
        </>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label={hasFilters ? "Matching orders" : "Orders"}
            value={formatCount(allCount)}
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <StatCard
            label="Order value"
            value={formatPrice(data.summary.value)}
            hint="Excluding cancelled orders"
            icon={<Wallet className="h-5 w-5" />}
            tone="leaf"
          />
        </div>
      )}

      {/* Search + date range (the CSV uses the same filters) */}
      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(input.trim());
            setPage(1);
          }}
        >
          <div className="min-w-0 flex-1">
            <Input
              label="Search"
              placeholder="Order #, buyer, phone, email or shop…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <Button type="submit" className="self-end" leftIcon={<Search className="h-4 w-4" />}>
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
        <Button variant="ghost" onClick={clearFilters} disabled={!hasFilters} leftIcon={<X className="h-4 w-4" />}>
          Clear
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={status === undefined ? "primary" : "outline"}
          onClick={() => {
            setStatus(undefined);
            setPage(1);
          }}
        >
          All
        </Button>
        {STATUSES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? "primary" : "outline"}
            className="capitalize"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            {s}
            {counts && status === undefined && <span className="ml-1 opacity-60">({counts[s]})</span>}
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
                {hasFilters || status ? "No orders match these filters." : "No orders yet."}
              </p>
            }
          />
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {data.page} of {data.pages} · {formatCount(data.total)} orders
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

      {viewing && <OrderDetails order={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
