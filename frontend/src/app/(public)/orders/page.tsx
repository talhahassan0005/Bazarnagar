"use client";

import { useEffect, useState } from "react";
import { PackageSearch } from "lucide-react";
import { Card, EmptyState, Skeleton, Button } from "@/components/ui";
import { useGetOrdersByIdsQuery } from "@/store/apiSlice";
import { getRememberedOrderIds } from "@/lib/orderHistory";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_CLASS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-brand-100 text-brand-800",
  delivered: "bg-leaf-500/15 text-leaf-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">
              #{order.id.slice(-6).toUpperCase()}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_CLASS[order.status]}`}>
              {order.status}
            </span>
            {order.paymentStatus === "paid" ? (
              <span className="rounded-full bg-leaf-500/15 px-2.5 py-0.5 text-xs font-medium text-leaf-700">
                Paid
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                {order.paymentMethod === "card" ? "Card · unpaid" : "Cash on Delivery"}
              </span>
            )}
          </div>
          {order.storeName && (
            <p className="mt-1 text-sm font-medium text-brand-700">{order.storeName}</p>
          )}
          <p className="mt-0.5 text-xs text-slate-400">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-1 text-sm">
        {order.items.map((it, i) => (
          <li key={i} className="flex justify-between gap-2 text-slate-600">
            <span className="min-w-0 truncate">
              {it.name} × {it.quantity}
            </span>
            <span className="shrink-0">{formatPrice(it.price * it.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-sm font-semibold text-slate-900">
        <span>Total</span>
        <span>{formatPrice(order.total)}</span>
      </div>
    </Card>
  );
}

export default function MyOrdersPage() {
  const [orderIds, setOrderIds] = useState<string[] | null>(null);

  useEffect(() => {
    setOrderIds(getRememberedOrderIds());
  }, []);

  const { data: orders, isFetching, refetch } = useGetOrdersByIdsQuery(orderIds ?? [], {
    skip: !orderIds || orderIds.length === 0,
  });

  const loading = orderIds === null || isFetching;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">My orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            No account needed — this remembers orders placed from this browser only.
          </p>
        </div>
        {orderIds && orderIds.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {loading && (
          <>
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </>
        )}

        {!loading && (!orderIds || orderIds.length === 0) && (
          <EmptyState
            icon={<PackageSearch className="h-6 w-6" />}
            title="No orders yet"
            description="Orders you place will show up here automatically — on this device."
            action={<Button href="/search">Browse products</Button>}
          />
        )}

        {!loading && orders && orders.length > 0 && (
          <>
            <p className="text-sm text-slate-500">
              {orders.length} order{orders.length === 1 ? "" : "s"} from this device.
            </p>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
