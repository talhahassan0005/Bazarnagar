"use client";

import { Card, CardBody, CardHeader, Skeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { PlanCard } from "@/components/domain/PlanCard";
import { PlanUsageBar } from "@/components/domain/StatCard";
import { SubscriptionBadge } from "@/components/domain/StatusBadges";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  useChangePlanMutation,
  useGetSellerQuery,
  useGetMyProductsQuery,
} from "@/store/apiSlice";
import { addToast } from "@/store/uiSlice";
import { PLANS, PLAN_LIST } from "@/lib/constants";
import { formatPrice, getErrorMessage } from "@/lib/utils";

export default function PlanPage() {
  const dispatch = useAppDispatch();
  const sellerId = useAppSelector((s) => s.auth.sellerId) ?? undefined;
  const seller = useGetSellerQuery(sellerId);
  const products = useGetMyProductsQuery(sellerId);
  const [changePlan] = useChangePlanMutation();

  if (seller.isLoading || products.isLoading || !seller.data) {
    return (
      <>
        <PageHeader title="Plan & billing" />
        <Skeleton className="mb-6 h-32 rounded-2xl" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      </>
    );
  }

  const current = PLANS[seller.data.planId];
  const used = (products.data ?? []).length;

  return (
    <>
      <PageHeader
        title="Plan & billing"
        description="Manage your subscription and product limits."
      />

      <Card className="mb-6">
        <CardHeader title="Current subscription" />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900">{current.name}</span>
              <SubscriptionBadge status={seller.data!.subscriptionStatus} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {formatPrice(current.price)} / month · {current.imageLimit} images per product
              {current.videoLimit > 0 ? ` · ${current.videoLimit} video(s)` : ""}
            </p>
          </div>
          <div className="sm:pl-6">
            <PlanUsageBar used={used} limit={current.productLimit} />
          </div>
        </CardBody>
      </Card>

      <h2 className="mb-4 text-lg font-semibold text-slate-900">Available plans</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_LIST.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            current={plan.id === current.id}
            onSelect={async (p) => {
              if (p.id === current.id) return;
              try {
                await changePlan(p.id).unwrap();
                dispatch(addToast(`Switched to the ${p.name} plan`, "success"));
              } catch (err) {
                dispatch(
                  addToast(getErrorMessage(err, "Could not change plan"), "error")
                );
              }
            }}
          />
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Your plan changes take effect immediately. An admin can also record manual
        payments against your account.
      </p>
    </>
  );
}
