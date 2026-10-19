"use client";

import { useState } from "react";
import { Pencil, Check, X, EyeOff, Eye } from "lucide-react";
import { Button, Card, LoadingPanel } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import {
  useGetAdminPlanConfigQuery,
  useUpdateAdminPlanConfigMutation,
  useGetAdminBoostConfigQuery,
  useUpdateAdminBoostConfigMutation,
} from "@/store/apiSlice";
import { formatPrice, getErrorMessage } from "@/lib/utils";
import type { BoostPricing, Plan, PlanId } from "@/lib/types";

const UNLIMITED = 1_000_000;

function Field({ label, value, onChange, hint }: {
  label: string; value: number; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        type="number" min={0} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function AdminPlanSettingsPage() {
  const dispatch = useAppDispatch();
  const { data: plans, isLoading } = useGetAdminPlanConfigQuery();
  const [updatePlan] = useUpdateAdminPlanConfigMutation();
  const [editing, setEditing] = useState<PlanId | null>(null);
  const [form, setForm] = useState<{ price: number; productLimit: number; imageLimit: number; videoLimit: number }>({ price: 0, productLimit: 0, imageLimit: 1, videoLimit: 0 });
  const [saving, setSaving] = useState(false);

  if (isLoading) return <LoadingPanel label="Loading plan config…" />;

  function startEdit(plan: Plan) {
    setEditing(plan.id);
    setForm({ price: plan.price, productLimit: plan.productLimit, imageLimit: plan.imageLimit, videoLimit: plan.videoLimit });
  }

  async function save(planId: PlanId) {
    setSaving(true);
    try {
      await updatePlan({
        planId,
        price: form.price,
        productLimit: form.productLimit >= 999999 ? UNLIMITED : form.productLimit,
        imageLimit: form.imageLimit,
        videoLimit: form.videoLimit,
      }).unwrap();
      dispatch(addToast("Plan updated", "success"));
      setEditing(null);
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Update failed"), "error"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(plan: Plan) {
    try {
      await updatePlan({
        planId: plan.id,
        price: plan.price,
        productLimit: plan.productLimit,
        imageLimit: plan.imageLimit,
        videoLimit: plan.videoLimit,
        enabled: !(plan.enabled ?? true),
      }).unwrap();
      dispatch(addToast(`Plan ${plan.enabled ?? true ? "disabled" : "enabled"}`, "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Update failed"), "error"));
    }
  }

  return (
    <>
      <PageHeader
        title="Plan Settings"
        description="Edit subscription plan prices and limits. Changes apply immediately."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(plans ?? []).map((plan) => {
          const isEnabled = plan.enabled ?? true;
          return (
            <Card key={plan.id} className={`p-5 ${!isEnabled ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800 capitalize">{plan.name}</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleEnabled(plan)}
                    title={isEnabled ? "Disable plan" : "Enable plan"}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    {isEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {editing !== plan.id && (
                    <button onClick={() => startEdit(plan)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {!isEnabled && (
                <p className="mt-1 text-xs font-medium text-red-500">Disabled — hidden from sellers</p>
              )}

              {editing === plan.id ? (
                <div className="mt-3 space-y-3">
                  <Field label="Price (PKR/mo)" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: v }))} />
                  <Field label="Product limit" value={form.productLimit >= UNLIMITED ? 999999 : form.productLimit} onChange={(v) => setForm((f) => ({ ...f, productLimit: v }))} hint="999999 = unlimited" />
                  <Field label="Images per product" value={form.imageLimit} onChange={(v) => setForm((f) => ({ ...f, imageLimit: v }))} />
                  <Field label="Videos per product" value={form.videoLimit} onChange={(v) => setForm((f) => ({ ...f, videoLimit: v }))} />
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" loading={saving} onClick={() => save(plan.id)} leftIcon={<Check className="h-3.5 w-3.5" />}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(null)} leftIcon={<X className="h-3.5 w-3.5" />}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">{formatPrice(plan.price)}</span> / month</p>
                  <p>Products: <span className="font-medium">{plan.productLimit >= UNLIMITED ? "Unlimited" : plan.productLimit}</span></p>
                  <p>Images: <span className="font-medium">{plan.imageLimit} per product</span></p>
                  <p>Videos: <span className="font-medium">{plan.videoLimit} per product</span></p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <BoostPricingSection />
    </>
  );
}

/** Per-day boost price and allowed day range — any seller can boost. */
function BoostPricingSection() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetAdminBoostConfigQuery();
  const [updateBoost, { isLoading: saving }] = useUpdateAdminBoostConfigMutation();
  // Local edits; null means "showing the saved values".
  const [form, setForm] = useState<BoostPricing | null>(null);
  const values = form ?? data;

  async function save() {
    if (!values) return;
    try {
      await updateBoost(values).unwrap();
      dispatch(addToast("Boost pricing updated", "success"));
      setForm(null);
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Update failed"), "error"));
    }
  }

  const set = (key: keyof BoostPricing) => (v: number) =>
    setForm((f) => ({ ...(f ?? data!), [key]: v }));

  return (
    <div className="mt-10">
      <PageHeader
        title="Boost Pricing"
        description="Every seller — free plan included — can feature a product for a daily fee. Changes apply immediately."
      />
      {isLoading || !values ? (
        <LoadingPanel label="Loading boost pricing…" />
      ) : (
        <Card className="max-w-xl p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price per day (PKR)" value={values.pricePerDay} onChange={set("pricePerDay")} />
            <Field label="Minimum days" value={values.minDays} onChange={set("minDays")} />
            <Field label="Maximum days" value={values.maxDays} onChange={set("maxDays")} />
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Example: 7 days = <span className="font-semibold text-slate-900">{formatPrice(values.pricePerDay * 7)}</span>
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" loading={saving} disabled={!form} onClick={save} leftIcon={<Check className="h-3.5 w-3.5" />}>
              Save
            </Button>
            {form && (
              <Button size="sm" variant="outline" onClick={() => setForm(null)} leftIcon={<X className="h-3.5 w-3.5" />}>
                Cancel
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
