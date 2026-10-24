"use client";

import { useState } from "react";
import { Pencil, Check, X, EyeOff, Eye } from "lucide-react";
import { Button, Card, LoadingPanel, Toggle } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import {
  useGetAdminPlanConfigQuery,
  useUpdateAdminPlanConfigMutation,
  useGetAdminBoostConfigQuery,
  useUpdateAdminBoostConfigMutation,
  useGetSubscriptionSettingsQuery,
  useGetPlanPaymentConfigQuery,
  useUpdatePlanPaymentConfigMutation,
  useUpdateSubscriptionSettingsMutation,
} from "@/store/apiSlice";
import { formatPrice, formatUsd, getErrorMessage } from "@/lib/utils";
import type { BoostPricing, Plan, PlanId, PlanPaymentConfig, SubscriptionSettings } from "@/lib/types";

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

function TextField({ label, value, onChange, placeholder, multiline, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; hint?: string;
}) {
  const cls = "w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {multiline ? (
        <textarea rows={4} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cls} />
      ) : (
        <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

interface PlanForm {
  price: number;
  priceUsd: number;
  productLimit: number;
  imageLimit: number;
  videoLimit: number;
  name: string;
  tagline: string;
  description: string;
  /** One feature per line. */
  features: string;
  highlighted: boolean;
}

const toForm = (plan: Plan): PlanForm => ({
  price: plan.price,
  priceUsd: plan.priceUsd ?? 0,
  productLimit: plan.productLimit,
  imageLimit: plan.imageLimit,
  videoLimit: plan.videoLimit,
  name: plan.name,
  tagline: plan.tagline ?? "",
  description: plan.description ?? "",
  features: (plan.features ?? []).join("\n"),
  highlighted: plan.highlighted ?? false,
});

export default function AdminPlanSettingsPage() {
  const dispatch = useAppDispatch();
  const { data: plans, isLoading } = useGetAdminPlanConfigQuery();
  const [updatePlan] = useUpdateAdminPlanConfigMutation();
  const [editing, setEditing] = useState<PlanId | null>(null);
  const [form, setForm] = useState<PlanForm | null>(null);
  const [saving, setSaving] = useState(false);

  if (isLoading) return <LoadingPanel label="Loading plan config…" />;

  function startEdit(plan: Plan) {
    setEditing(plan.id);
    setForm(toForm(plan));
  }

  async function save(plan: Plan) {
    if (!form) return;
    setSaving(true);
    try {
      await updatePlan({
        planId: plan.id,
        price: form.price,
        priceUsd: form.priceUsd,
        productLimit: form.productLimit >= 999999 ? UNLIMITED : form.productLimit,
        imageLimit: form.imageLimit,
        videoLimit: form.videoLimit,
        enabled: plan.enabled ?? true,
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
        highlighted: form.highlighted,
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
        description="Edit plan prices (PKR and USD), limits and the pricing page cards. Changes apply immediately."
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

              {editing === plan.id && form ? (
                <div className="mt-3 space-y-3">
                  <TextField label="Plan name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Price (PKR/mo)" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
                    <Field label="Price (USD/mo)" value={form.priceUsd} onChange={(v) => setForm({ ...form, priceUsd: v })} hint="0 = no dollar price" />
                  </div>
                  <Field label="Product limit" value={form.productLimit >= UNLIMITED ? 999999 : form.productLimit} onChange={(v) => setForm({ ...form, productLimit: v })} hint="999999 = unlimited" />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Images / product" value={form.imageLimit} onChange={(v) => setForm({ ...form, imageLimit: v })} />
                    <Field label="Videos / product" value={form.videoLimit} onChange={(v) => setForm({ ...form, videoLimit: v })} />
                  </div>
                  <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Pricing page card</p>
                  <TextField label="Badge text" value={form.tagline} placeholder="Free forever" onChange={(v) => setForm({ ...form, tagline: v })} />
                  <TextField label="Description" multiline value={form.description} placeholder="Who is this plan for?" onChange={(v) => setForm({ ...form, description: v })} />
                  <TextField
                    label="Features"
                    multiline
                    value={form.features}
                    placeholder={"Direct WhatsApp orders\nPriority support"}
                    onChange={(v) => setForm({ ...form, features: v })}
                    hint="One per line. Product & image limits are added automatically."
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.highlighted}
                      onChange={(e) => setForm({ ...form, highlighted: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                    />
                    Show as &ldquo;Recommended&rdquo;
                  </label>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" loading={saving} onClick={() => save(plan)} leftIcon={<Check className="h-3.5 w-3.5" />}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(null)} leftIcon={<X className="h-3.5 w-3.5" />}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">{formatPrice(plan.price)}</span> / month</p>
                  <p>USD: <span className="font-medium">{plan.priceUsd ? `${formatUsd(plan.priceUsd)} / month` : "Not set"}</span></p>
                  {plan.highlighted && <p className="text-xs font-semibold text-brand-700">★ Recommended on pricing page</p>}
                  <p>Products: <span className="font-medium">{plan.productLimit >= UNLIMITED ? "Unlimited" : plan.productLimit}</span></p>
                  <p>Images: <span className="font-medium">{plan.imageLimit} per product</span></p>
                  <p>Videos: <span className="font-medium">{plan.videoLimit} per product</span></p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <PaymentCurrencySection />
      <ExpiryPolicySection />
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

/** What happens when a seller's paid plan expires and they don't renew. */
function ExpiryPolicySection() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetSubscriptionSettingsQuery();
  const [update, { isLoading: saving }] = useUpdateSubscriptionSettingsMutation();
  // Local edits; null means "showing the saved values".
  const [form, setForm] = useState<SubscriptionSettings | null>(null);
  const values = form ?? data;

  async function save() {
    if (!values) return;
    try {
      await update(values).unwrap();
      dispatch(addToast("Expiry rule updated", "success"));
      setForm(null);
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Update failed"), "error"));
    }
  }

  return (
    <div className="mt-10">
      <PageHeader
        title="When a Plan Expires"
        description="Choose whether sellers keep their paid plan after it expires, or move to the Free plan if they don't renew."
      />
      {isLoading || !values ? (
        <LoadingPanel label="Loading…" />
      ) : (
        <Card className="max-w-xl space-y-4 p-5">
          <Toggle
            label="Move to the Free plan if not renewed"
            description={
              values.downgradeAfterExpiry
                ? `Sellers get 3 reminder emails over ${values.graceDays} days. Then they move to Free: only their first products up to the Free limit stay public, the rest are hidden (not deleted) until they renew.`
                : "Sellers keep their paid plan's features after it expires. No reminder emails are sent."
            }
            checked={values.downgradeAfterExpiry}
            onChange={(v) => setForm({ ...values, downgradeAfterExpiry: v })}
          />
          {values.downgradeAfterExpiry && (
            <div className="max-w-[12rem]">
              <Field
                label="Grace period (days)"
                value={values.graceDays}
                onChange={(v) => setForm({ ...values, graceDays: v })}
                hint="1–60 days"
              />
            </div>
          )}
          <div className="flex gap-2">
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

/**
 * Plan payment fees: tax when a seller outside Pakistan pays in USD (PKR has
 * none), and a card fee when anyone pays online by card.
 */
function PaymentCurrencySection() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetPlanPaymentConfigQuery();
  const [update, { isLoading: saving }] = useUpdatePlanPaymentConfigMutation();
  // Local edits; null means "showing the saved values".
  const [form, setForm] = useState<PlanPaymentConfig | null>(null);
  const values = form ?? data ?? { usdTaxPercent: 0, cardFeePercent: 0 };
  const exampleTax = (10 * values.usdTaxPercent) / 100;
  const exampleCard = ((10 + exampleTax) * values.cardFeePercent) / 100;
  const usd = (n: number) => formatUsd(Math.round(n * 100) / 100);

  async function save() {
    try {
      await update(values).unwrap();
      dispatch(addToast("Payment fees updated", "success"));
      setForm(null);
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Update failed"), "error"));
    }
  }

  return (
    <div className="mt-10">
      <PageHeader
        title="Payment Currency, Tax & Card Fee"
        description="Sellers choose where they pay from. Pakistan pays the PKR price with no tax; other countries pay the plan's USD price plus tax. Paying online by card adds the card fee."
      />
      {isLoading ? (
        <LoadingPanel label="Loading…" />
      ) : (
        <Card className="max-w-xl space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Tax on USD payments (%)"
              value={values.usdTaxPercent}
              onChange={(v) => setForm({ ...values, usdTaxPercent: v })}
              hint="Outside Pakistan only. 0 = no tax"
            />
            <Field
              label="Card fee (%)"
              value={values.cardFeePercent}
              onChange={(v) => setForm({ ...values, cardFeePercent: v })}
              hint="Online card payments (PKR & USD). 0 = none"
            />
          </div>
          <p className="text-sm text-slate-500">
            Example — a $10 plan from outside Pakistan:{" "}
            <span className="font-semibold text-slate-900">{usd(10 + exampleTax)}</span> by bank transfer,{" "}
            <span className="font-semibold text-slate-900">{usd(10 + exampleTax + exampleCard)}</span> by card. Set each
            plan&apos;s USD price above.
          </p>
          <div className="flex gap-2">
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
