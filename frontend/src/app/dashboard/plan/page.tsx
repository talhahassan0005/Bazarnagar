"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CreditCard, RefreshCw, X, AlertTriangle, CheckCircle, Clock, Ban } from "lucide-react";
import { Button, Card, CardBody, CardHeader, Skeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { PlanCard } from "@/components/domain/PlanCard";
import { PlanUsageBar } from "@/components/domain/StatCard";
import { ManualPaymentModal } from "@/components/domain/ManualPaymentModal";
import { useAppDispatch } from "@/store/hooks";
import {
  useGetSellerQuery,
  useGetMyProductsQuery,
  useGetSubscriptionStatusQuery,
  useSubscriptionCheckoutMutation,
  useCancelSubscriptionMutation,
  useGetMyPaymentsQuery,
  useGetPublicPlanConfigQuery,
  useGetMyPaymentRequestsQuery,
} from "@/store/apiSlice";
import { addToast } from "@/store/uiSlice";
import { PLANS } from "@/lib/constants";
import { formatPrice, getErrorMessage } from "@/lib/utils";
import type { Plan } from "@/lib/types";

function StatusBanner({ status, endsAt, daysRemaining }: {
  status: string;
  endsAt: string | null;
  daysRemaining: number;
}) {
  const date = endsAt
    ? new Date(endsAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })
    : null;

  if (status === "active") {
    if (daysRemaining <= 7) return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Expires in <strong>{daysRemaining} day{daysRemaining !== 1 ? "s" : ""}</strong>{date ? ` on ${date}` : ""}. Renew now to avoid interruption.</span>
      </div>
    );
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Active{date ? <> — renews <strong>{date}</strong></> : ""}{daysRemaining > 0 ? ` · ${daysRemaining} days remaining` : ""}</span>
      </div>
    );
  }
  if (status === "trial") return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      <Clock className="mt-0.5 h-4 w-4 shrink-0" />
      <span>Free trial{date ? <> — ends <strong>{date}</strong></> : ""}. Subscribe to keep your shop live after trial ends.</span>
    </div>
  );
  if (status === "cancelled") return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <Ban className="mt-0.5 h-4 w-4 shrink-0" />
      <span>Cancelled{date ? <> — access until <strong>{date}</strong></> : ""}. Renew to keep your shop active.</span>
    </div>
  );
  if (status === "expired") return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>Subscription expired. Your shop is hidden from search. Renew to reactivate.</span>
    </div>
  );
  return null;
}

// How long to keep polling after a checkout redirect before giving up and
// falling back to the manual "Check payment status" button. This catches any
// brief race between the Stripe redirect and the webhook actually landing.
const PENDING_PAYMENT_POLL_MS = 4000;
const PENDING_PAYMENT_TIMEOUT_MS = 3 * 60 * 1000;
const PENDING_PAYMENT_KEY = "sub_pending_payment";

export default function PlanPage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const router = useRouter();

  const seller = useGetSellerQuery();
  const products = useGetMyProductsQuery();
  const sub = useGetSubscriptionStatusQuery();
  const payments = useGetMyPaymentsQuery();
  const planConfig = useGetPublicPlanConfigQuery();
  const manualRequests = useGetMyPaymentRequestsQuery();
  const [checkout, { isLoading: checkingOut }] = useSubscriptionCheckoutMutation();
  const [cancelSub, { isLoading: cancelling }] = useCancelSubscriptionMutation();

  const [checkingPayment, setCheckingPayment] = useState(false);
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearPendingPoll() {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = null;
    sessionStorage.removeItem(PENDING_PAYMENT_KEY);
    setCheckingPayment(false);
  }

  function startPendingPoll(startedAt: number) {
    setCheckingPayment(true);
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(() => {
      if (Date.now() - startedAt > PENDING_PAYMENT_TIMEOUT_MS) {
        clearPendingPoll();
        return;
      }
      seller.refetch();
      sub.refetch();
    }, PENDING_PAYMENT_POLL_MS);
  }

  async function handleManualCheck() {
    const [s] = await Promise.all([sub.refetch(), seller.refetch(), payments.refetch()]);
    if (s.data?.subscriptionStatus === "active") {
      dispatch(addToast("Payment confirmed! Your subscription is now active.", "success"));
      clearPendingPoll();
    } else {
      dispatch(addToast("Still not confirmed yet. If you completed payment, please wait a moment and try again, or contact support.", "info"));
    }
  }

  // Handle payment gateway return (full-page redirect fallback)
  useEffect(() => {
    if (sessionStorage.getItem("sub_success")) {
      sessionStorage.removeItem("sub_success");
      dispatch(addToast("Payment successful! Your subscription is now active.", "success"));
    }
    const p = searchParams.get("payment");
    if (!p) return;
    if (p === "success") {
      sessionStorage.setItem("sub_success", "1");
      clearPendingPoll();
      seller.refetch();
      sub.refetch();
      payments.refetch();
      window.history.replaceState({}, "", "/dashboard/plan");
      window.location.reload();
      return;
    }
    if (p === "failed") dispatch(addToast("Payment failed or was not completed. Please try again.", "error"));
    if (p === "cancelled") dispatch(addToast("Payment was cancelled.", "error"));
    router.replace("/dashboard/plan");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback: if we redirected out for a payment and never got a `?payment=`
  // query back (e.g. the tab was closed and reopened), poll subscription
  // status in the background so the UI catches up as soon as the webhook
  // actually activates the plan.
  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY);
    if (!raw) return;
    try {
      const { startedAt } = JSON.parse(raw) as { startedAt: number };
      if (Date.now() - startedAt > PENDING_PAYMENT_TIMEOUT_MS) {
        sessionStorage.removeItem(PENDING_PAYMENT_KEY);
        return;
      }
      startPendingPoll(startedAt);
    } catch {
      sessionStorage.removeItem(PENDING_PAYMENT_KEY);
    }
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop polling as soon as the subscription actually shows active.
  useEffect(() => {
    if (!checkingPayment) return;
    if (sub.data?.subscriptionStatus === "active" || seller.data?.subscriptionStatus === "active") {
      dispatch(addToast("Payment confirmed! Your subscription is now active.", "success"));
      clearPendingPoll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub.data, seller.data, checkingPayment]);

  // Wait only for seller + products — sub status is optional (has its own fallback)
  if (seller.isLoading || products.isLoading || !seller.data) {
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

  // Use live DB plan config if available, fall back to hardcoded constants
  const livePlans = planConfig.data;
  const livePlanMap = livePlans
    ? Object.fromEntries(livePlans.map((p) => [p.id, p]))
    : PLANS;
  const current = livePlanMap[seller.data.planId] ?? PLANS[seller.data.planId];
  // Only show enabled plans (disabled plans hidden from sellers, but current plan always shown)
  const planList = (livePlans ?? Object.values(PLANS)).filter(
    (p) => (p.enabled ?? true) || p.id === seller.data!.planId
  );
  const used = (products.data ?? []).length;

  // Use sub.data if available, fall back to seller.data fields
  const status = sub.data?.subscriptionStatus ?? seller.data.subscriptionStatus;
  const endsAt = sub.data?.subscriptionEndsAt ?? seller.data.subscriptionEndsAt ?? null;
  const daysRemaining = sub.data?.daysRemaining ?? (
    endsAt ? Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000)) : 0
  );

  const isActive = status === "active";
  const isExpiredOrCancelled = status === "expired" || status === "cancelled";
  const isTrial = status === "trial";
  const needsRenewal = isExpiredOrCancelled || isTrial;

  async function handleSubscribe(plan: Plan) {
    try {
      const { url } = await checkout(plan.id).unwrap();
      // Remember that a payment is pending so that even if the browser
      // redirect back is delayed or interrupted, we still detect activation
      // via polling.
      sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify({ planId: plan.id, startedAt: Date.now() }));
      // Full page redirect — most reliable, no popup/postMessage issues
      window.location.assign(url);
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not initiate payment. Please try again."), "error"));
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

      <Card className="mb-6">
        <CardHeader
          title="Current subscription"
          action={
            <Button
              size="sm"
              variant="outline"
              loading={seller.isFetching || sub.isFetching}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={handleManualCheck}
            >
              Refresh status
            </Button>
          }
        />
        <CardBody className="space-y-4">
          {checkingPayment && (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
              <div className="flex-1">
                <span>Confirming your payment… this can take a minute. Please don&apos;t close this page.</span>
                <button
                  type="button"
                  onClick={handleManualCheck}
                  className="ml-2 font-medium underline underline-offset-2"
                >
                  Check now
                </button>
              </div>
            </div>
          )}
          <StatusBanner status={status} endsAt={endsAt} daysRemaining={daysRemaining} />

          {manualRequests.data?.some((r) => r.status === "pending") && (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Your manual payment is awaiting verification — we&apos;ll activate your plan once
                it&apos;s confirmed, usually within a few hours.
              </span>
            </div>
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

              <div className="mt-4 flex flex-wrap gap-2">
                {needsRenewal && (
                  <Button size="sm" loading={checkingOut}
                    leftIcon={<CreditCard className="h-4 w-4" />}
                    onClick={() => handleSubscribe(current)}>
                    {isTrial ? "Subscribe now" : "Renew subscription"}
                  </Button>
                )}
                {isActive && daysRemaining <= 7 && (
                  <Button size="sm" loading={checkingOut}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    onClick={() => handleSubscribe(current)}>
                    Renew early
                  </Button>
                )}
                {isActive && (
                  <Button size="sm" variant="outline" loading={cancelling}
                    leftIcon={<X className="h-4 w-4" />}
                    onClick={handleCancel}>
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

      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        {isActive ? "Change plan" : "Choose a plan"}
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {planList.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            current={plan.id === current.id && isActive}
            onSelect={handleSubscribe}
          />
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Payments processed securely via Stripe · Card. Cancel anytime — access continues until period end.
        {" "}
        <button
          type="button"
          onClick={() => setManualPaymentOpen(true)}
          className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          Prefer bank transfer / JazzCash / EasyPaisa?
        </button>
      </p>

      {manualPaymentOpen && (
        <ManualPaymentModal
          plans={planList}
          defaultPlanId={current.id}
          onClose={() => {
            setManualPaymentOpen(false);
            manualRequests.refetch();
          }}
        />
      )}

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
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatPrice(p.amount)}</td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{p.method}</td>
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
