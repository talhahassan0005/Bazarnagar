"use client";

import { CreditCard } from "lucide-react";
import { Badge, Card, EmptyState, Skeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { useGetMyPaymentsQuery } from "@/store/apiSlice";
import { formatPrice } from "@/lib/utils";

export default function PaymentsPage() {
  const { data, isLoading } = useGetMyPaymentsQuery();

  return (
    <>
      <PageHeader
        title="Payment history"
        description="All subscription payments made on your account."
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-6 w-6" />}
          title="No payments yet"
          description="Your subscription payment history will appear here."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(p.paidAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 capitalize">{p.planId}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatPrice(p.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge tone="blue" className="capitalize">{p.method}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{p.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
