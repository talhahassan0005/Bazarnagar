"use client";

import { ShoppingBag } from "lucide-react";
import { Card, EmptyState, Select, TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useGetSellerOrdersQuery, useUpdateOrderStatusMutation } from "@/store/apiSlice";
import { formatPrice, getErrorMessage } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

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

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { data: orders, isLoading } = useGetSellerOrdersQuery();
  const [updateStatus] = useUpdateOrderStatusMutation();

  async function onChangeStatus(id: string, status: OrderStatus) {
    try {
      await updateStatus({ id, status }).unwrap();
      dispatch(addToast("Order status updated", "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Update failed"), "error"));
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Orders" />
        <TableSkeleton rows={5} />
      </>
    );
  }

  const list = orders ?? [];

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${list.length} order${list.length === 1 ? "" : "s"} received.`}
      />

      {list.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="No orders yet"
          description="Orders placed by customers on your shop will appear here."
        />
      ) : (
        <div className="space-y-4">
          {list.map((order) => (
            <Card key={order.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_CLASS[order.status]}`}
                    >
                      {order.status}
                    </span>
                    {order.paymentStatus === "paid" ? (
                      <span className="rounded-full bg-leaf-500/15 px-2.5 py-0.5 text-xs font-medium text-leaf-700">
                        Paid
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        {order.paymentMethod === "card" ? "Card · unpaid" : "COD"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                </div>
                <div className="w-44">
                  <Select
                    aria-label="Update status"
                    value={order.status}
                    onChange={(e) => onChangeStatus(order.id, e.target.value as OrderStatus)}
                    options={STATUSES.map((s) => ({
                      value: s,
                      label: s.charAt(0).toUpperCase() + s.slice(1),
                    }))}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr]">
                {/* Customer */}
                <div className="text-sm">
                  <p className="font-medium text-slate-700">{order.customerName}</p>
                  <p className="text-slate-500">{order.customerPhone}</p>
                  <p className="text-slate-500">
                    {order.customerAddress}, {order.customerCity}
                  </p>
                  {order.note && (
                    <p className="mt-1 text-xs italic text-slate-400">“{order.note}”</p>
                  )}
                </div>

                {/* Items */}
                <div>
                  <ul className="space-y-1 text-sm">
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
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
