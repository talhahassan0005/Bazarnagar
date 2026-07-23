"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CreditCard, RefreshCw, X, AlertTriangle, CheckCircle, Clock, Ban } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, Skeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { PlanCard } from "@/components/domain/PlanCard";
import { PlanUsageBar } from "@/components/domain/StatCard";
import { useAppDispatch } from "@/store/hooks";
import {
  useGetSellerQuery,
  useGetMyProductsQuery,
  useGetSubscriptionStatusQuery,
  useSubscriptionCheckoutMutation,
  useCancelSubscriptionMutation,
  useGetMyPaymentsQuery,
} from "@/store/apiSlice";
import { addToast } from "@/store/uiSlice";
import { PLANS, PLAN_LIST } from "@/lib/constants";
import { formatPrice, getErrorMessage } from "@/lib/utils";
import type { Plan } from "@/lib/types";

function StatusBanner({ status, endsAt, daysRemaining }: {
  status: string;
  endsAt: string | null;
  daysRemaining: number;
}) {
  const date = endsAt ? new Date(endsAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) : null;

  if (status === "active") {
    if (daysRemaining <= 7) {
      return (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your subscription expires in <strong>{daysRemaining} day{daysRemaining !== 1 ? "s" : ""}</strong> on {date}. Renew now to avoid interruption.</span>
        </div>
      );
    }
    return (
      <div className="flex items-start gap-3 rounded-xl border border-leaf-200 bg-leaf-50 px-4 py-3 text-sm text-leaf-800">
        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Active until <strong>{date}</strong> · {daysRemaining} days remaining</span>
      </div>
    );
  }
  if (status === "trial") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Free trial{date ? <> — ends <strong>{date}</strong></> : ""}. Subscribe to a plan to keep your shop live.</span>
      </div>
    );
  }
  if (status === "cancelled") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Ban className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Subscription cancelled{date ? <> — access until <strong>{date}</strong></> : ""}. Renew to keep your shop active.</span>
      </div>
    );
  }
  if (status === "expired") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Subscription expired. Your shop is hidden from search. Renew to reactivate.</span>
      </div>
    );
  }
  return null;
}

export default function PlanPage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const router = useRouter();
  const seller = useGetSellerQuery();
  const products = useGetMyProductsQuery();
  const sub = useGetSubscriptionStatusQuery();
  const payments = useGetMyPaymentsQuery();
  const [checkout, { isLoading: checkingOut }] = useSubscriptionCheckoutMutation();
  const [cancelSub, { isLoading: cancelling }] = useCancelSubscriptionMutation();

  useEffect(() => {
    // Check for pending success toast (set before reload)
    if (sessionStorage.getItem("sub_success")) {
      sessionStorage.removeItem("sub_success");
      dispatch(addToast("Payment successful! Subscription activated.", "success"));
    }

    const p = searchParams.get("payment");
    if (!p) return;
    if (p === "success") {
      sessionStorage.setItem("sub_success", "1");
      window.history.replaceState({}, "", "/dashboard/plan");
      window.location.reload();
      return;
    }
    if (p === "failed") dispatch(addToast("Payment failed. Please try again.", "error"));
    if (p === "cancelled") dispatch(addToast("Payment was cancelled.", "error"));
    router.replace("/dashboard/plan");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (seller.isLoading || products.isLoading || sub.isLoading || !seller.data) {
    return (
      <>
        <PageHeader title="Plan & billing" />
        <Skeleton className="mb-6 h-44 rounded-2xl" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </>
    );
  }

  const current = PLANS[seller.data.planId];
  const used = (products.data ?? []).length;
  const subData = sub.data;
  const status = subData?.subscriptionStatus ?? seller.data.subscriptionStatus;
  const isExpiredOrCancelled = status === "expired" || status === "cancelled";
  const isActive = status === "active";
  const isTrial = status === "trial";

  async function handleSubscribe(plan: Plan) {
    try {
      const { url } = await checkout(plan.id).unwrap();
      window.location.assign(url);
    } catch (err) {
      const msg = getErrorMessage(err, "Could not initiate payment");
      dispatch(addToast(msg, "error"));
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel subscription? You'll keep access until the current period ends.")) return;
    try {
      await cancelSub().unwrap();
      dispatch(addToast("Subscription cancelled. Access continues until period end.", "success"));
      seller.refetch();
      sub.refetch();
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not cancel subscription"), "error"));
    }
  }

  return (
    <>
      <PageHeader title="Plan & billing" description="Manage your subscription and product limits." />

      {/* Current subscription card */}
      <Card className="mb-6">
        <CardHeader title="Current subscription" />
        <CardBody className="space-y-4">
          {/* Status banner */}
          {subData && (
            <StatusBanner
              status={status}
              endsAt={subData.subscriptionEndsAt}
              daysRemaining={subData.daysRemaining}
            />
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{current.name}</span>
                <span className="text-sm text-slate-500">{formatPrice(current.price)}/mo</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {current.imageLimit} image{current.imageLimit !== 1 ? "s" : ""} per product
                {current.videoLimit > 0 ? ` · ${current.videoLimit} video(s)` : ""}
                {current.productLimit >= 1_000_000 ? " · Unlimited products" : ` · Up to ${current.productLimit} products`}
              </p>

              {/* Action buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                {(isExpiredOrCancelled || isTrial) && (
                  <Button
                    size="sm"
                    loading={checkingOut}
                    leftIcon={<CreditCard className="h-4 w-4" />}
                    onClick={() => handleSubscribe(current)}
                  >
                    {isTrial ? "Subscribe now" : "Renew subscription"}
                  </Button>
                )}
                {isActive && subData && subData.daysRemaining <= 7 && (
                  <Button
                    size="sm"
                    loading={checkingOut}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    onClick={() => handleSubscribe(current)}
                  >
                    Renew early
                  </Button>
                )}
                {isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={cancelling}
                    leftIcon={<X className="h-4 w-4" />}
                    onClick={handleCancel}
                  >
                    Cancel subscription
                  </Button>
                )}
              </div>
            </div>

            <div className="sm:pl-6">
              <PlanUsageBar used={used} limit={current.productLimit} />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Plan cards */}
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        {isActive ? "Upgrade your plan" : "Choose a plan"}
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_LIST.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            current={plan.id === current.id && isActive}
            onSelect={handleSubscribe}
          />
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Payments are processed securely via Safepay (EasyPaisa · JazzCash · Card). Cancel anytime — access continues until period end.
      </p>

      {/* Payment history */}
      {payments.data && payments.data.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Payment history</h2>
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
                  {payments.data.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(p.paidAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 capitalize">{p.planId}</td>
                      <td className="px-4 py-3 text-slate-900">{formatPrice(p.amount)}</td>
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
        </div>
      )}
    </>
  );
}
