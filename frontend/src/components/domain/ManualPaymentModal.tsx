"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";
import { Button, Input, Modal, Select } from "@/components/ui";
import { ImageUpload } from "@/components/domain/ImageUpload";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import {
  useCreatePaymentRequestMutation,
  useGetManualPaymentSettingsQuery,
} from "@/store/apiSlice";
import { formatPrice, getErrorMessage } from "@/lib/utils";
import type { Plan, PlanId, PaymentRequestMethod } from "@/lib/types";

const METHODS: { value: PaymentRequestMethod; label: string }[] = [
  { value: "bank", label: "Bank transfer" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "EasyPaisa" },
];

/** Seller-facing modal: pay for a plan manually (bank/JazzCash/EasyPaisa) instead of by card. */
export function ManualPaymentModal({
  plans,
  defaultPlanId,
  onClose,
}: {
  plans: Plan[];
  defaultPlanId: PlanId;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const { data: settings, isLoading: loadingSettings } = useGetManualPaymentSettingsQuery();
  const [createRequest, { isLoading: submitting }] = useCreatePaymentRequestMutation();

  const [planId, setPlanId] = useState<PlanId>(defaultPlanId);
  const [method, setMethod] = useState<PaymentRequestMethod>("bank");
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const plan = plans.find((p) => p.id === planId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) {
      dispatch(addToast("Enter the transaction ID / reference number", "error"));
      return;
    }
    try {
      await createRequest({ planId, method, reference: reference.trim(), proofUrl: proofUrl || undefined }).unwrap();
      setSubmitted(true);
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not submit payment request"), "error"));
    }
  }

  if (submitted) {
    return (
      <Modal open onClose={onClose} title="Payment submitted" footer={<Button onClick={onClose}>Done</Button>}>
        <p className="text-sm text-slate-600">
          Thanks! We&apos;ve received your payment details for <strong>{plan?.name}</strong>. Our
          team will verify it and activate your plan — usually within a few hours. You&apos;ll see
          the update here once it&apos;s approved.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Pay manually"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button form="manual-payment-form" type="submit" loading={submitting}>
            Submit payment
          </Button>
        </>
      }
    >
      <form id="manual-payment-form" onSubmit={onSubmit} className="space-y-4">
        <Select
          label="Plan"
          value={planId}
          onChange={(e) => setPlanId(e.target.value as PlanId)}
          options={plans.map((p) => ({ value: p.id, label: `${p.name} — ${formatPrice(p.price)}/mo` }))}
        />

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
          <p className="mb-2 flex items-center gap-1.5 font-medium text-slate-700">
            <Landmark className="h-4 w-4" /> Send {plan ? formatPrice(plan.price) : "—"} to:
          </p>
          {loadingSettings ? (
            <p className="text-slate-400">Loading payment details…</p>
          ) : settings ? (
            <ul className="space-y-1 text-slate-600">
              {settings.bankAccountNumber && (
                <li>
                  <span className="text-slate-400">Bank:</span> {settings.bankName} —{" "}
                  {settings.bankAccountTitle} — {settings.bankAccountNumber}
                </li>
              )}
              {settings.jazzcashNumber && (
                <li><span className="text-slate-400">JazzCash:</span> {settings.jazzcashNumber}</li>
              )}
              {settings.easypaisaNumber && (
                <li><span className="text-slate-400">EasyPaisa:</span> {settings.easypaisaNumber}</li>
              )}
              {settings.instructions && <li className="pt-1 text-xs text-slate-500">{settings.instructions}</li>}
              {!settings.bankAccountNumber && !settings.jazzcashNumber && !settings.easypaisaNumber && (
                <li className="text-amber-600">Payment details haven&apos;t been set up yet — please contact support.</li>
              )}
            </ul>
          ) : null}
        </div>

        <Select
          label="Paid via"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentRequestMethod)}
          options={METHODS}
        />
        <Input
          label="Transaction ID / reference number"
          required
          placeholder="e.g. TRX123456789"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
        <ImageUpload
          label="Payment screenshot (optional)"
          value={proofUrl}
          onChange={setProofUrl}
        />
      </form>
    </Modal>
  );
}
