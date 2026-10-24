"use client";

import { useState } from "react";
import { Download, Landmark } from "lucide-react";
import { Button, Input, Modal, Select } from "@/components/ui";
import { ImageUpload } from "@/components/domain/ImageUpload";
import { PaymentHelpLink } from "@/components/domain/PaymentHelpLink";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import {
  useCreatePaymentRequestMutation,
  useGetManualPaymentSettingsQuery,
} from "@/store/apiSlice";
import { formatMoney, formatPrice, getErrorMessage } from "@/lib/utils";
import type { Plan, PlanId, PaymentCurrency, PaymentRequestMethod } from "@/lib/types";
import { PaymentCurrencySelect, quoteFor, usePlanPaymentConfig } from "@/components/domain/PaymentCurrencySelect";

export const PAYMENT_METHODS: { value: PaymentRequestMethod; label: string }[] = [
  { value: "bank", label: "Bank transfer" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "EasyPaisa" },
];

/** Platform JazzCash / Raast QR (frontend/public) and its till ID. */
const JAZZCASH_QR = "/JazzCash-QR.jpeg";
const JAZZCASH_TILL_ID = "983903291";

/** Scan-to-pay JazzCash QR, with a download for paying from the same phone. */
function JazzCashQr({ amount }: { amount: number | null }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:flex-row sm:items-start">
      <a href={JAZZCASH_QR} target="_blank" rel="noopener noreferrer" className="shrink-0">
        <img
          src={JAZZCASH_QR}
          alt="JazzCash QR code to pay Bazaar Nagar"
          className="w-44 rounded-lg border border-amber-200 bg-white shadow-sm"
        />
      </a>
      <div className="text-sm text-slate-700">
        <p className="font-semibold text-slate-900">
          Scan &amp; pay {amount != null ? formatPrice(amount) : ""}
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-600">
          <li>Open JazzCash (or any bank app with Raast QR) and scan this code.</li>
          <li>Pay the exact amount and take a screenshot of the receipt.</li>
          <li>Upload the screenshot below and submit — we&apos;ll activate your plan once it&apos;s verified.</li>
        </ol>
        <p className="mt-2 text-xs text-slate-500">
          No QR scanner? Dial <strong>*786*10#</strong> and enter Till ID <strong>{JAZZCASH_TILL_ID}</strong>.
        </p>
        <a
          href={JAZZCASH_QR}
          download="BazaarNagar-JazzCash-QR.jpeg"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
        >
          <Download className="h-3.5 w-3.5" /> Download QR (to scan from your gallery)
        </a>
      </div>
    </div>
  );
}

/**
 * QR code plus a "Send Rs X to:" box listing the admin's bank / JazzCash /
 * EasyPaisa details. USD payments (from abroad) get bank transfer only — the
 * JazzCash QR takes PKR.
 */
export function PayToDetails({ amount, currency = "PKR" }: { amount: number | null; currency?: PaymentCurrency }) {
  const { data: settings, isLoading } = useGetManualPaymentSettingsQuery();
  const usd = currency === "USD";
  const hasDetails = usd
    ? Boolean(settings?.bankAccountNumber)
    : Boolean(settings?.bankAccountNumber || settings?.jazzcashNumber || settings?.easypaisaNumber);
  return (
    <div className="space-y-3">
      {usd ? (
        <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-800">
          Paying from outside Pakistan: send <strong>{amount != null ? formatMoney(amount, "USD") : "—"}</strong> by
          international bank transfer to the account below.
          {!isLoading && !hasDetails && " Our bank details aren't set up yet — please contact us using the link below."}
        </p>
      ) : (
        <JazzCashQr amount={amount} />
      )}
      {(isLoading || hasDetails) && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
          <p className="mb-2 flex items-center gap-1.5 font-medium text-slate-700">
            <Landmark className="h-4 w-4" /> {usd ? "Send" : "Or send"} {amount != null ? formatMoney(amount, currency) : "—"} to:
          </p>
          {isLoading ? (
            <p className="text-slate-400">Loading payment details…</p>
          ) : settings ? (
            <ul className="space-y-1 text-slate-600">
              {settings.bankAccountNumber && (
                <li>
                  <span className="text-slate-400">Bank:</span> {settings.bankName} —{" "}
                  {settings.bankAccountTitle} — {settings.bankAccountNumber}
                </li>
              )}
              {!usd && settings.jazzcashNumber && (
                <li><span className="text-slate-400">JazzCash:</span> {settings.jazzcashNumber}</li>
              )}
              {!usd && settings.easypaisaNumber && (
                <li><span className="text-slate-400">EasyPaisa:</span> {settings.easypaisaNumber}</li>
              )}
              {settings.instructions && <li className="pt-1 text-xs text-slate-500">{settings.instructions}</li>}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Seller-facing modal: pay for a plan manually (bank/JazzCash/EasyPaisa) instead of by card. */
export function ManualPaymentModal({
  plans,
  defaultPlanId,
  defaultCurrency = "PKR",
  onClose,
}: {
  plans: Plan[];
  defaultPlanId: PlanId;
  defaultCurrency?: PaymentCurrency;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const [createRequest, { isLoading: submitting }] = useCreatePaymentRequestMutation();

  const [planId, setPlanId] = useState<PlanId>(defaultPlanId);
  const [currency, setCurrency] = useState<PaymentCurrency>(defaultCurrency);
  const [method, setMethod] = useState<PaymentRequestMethod>(defaultCurrency === "USD" ? "bank" : "jazzcash");
  const paymentConfig = usePlanPaymentConfig();
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const plan = plans.find((p) => p.id === planId);
  const quote = plan ? quoteFor(plan, currency, paymentConfig) : null;

  function changeCurrency(c: PaymentCurrency) {
    setCurrency(c);
    // JazzCash / EasyPaisa only work in Pakistan.
    if (c === "USD") setMethod("bank");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) {
      dispatch(addToast("Enter the transaction ID / reference number", "error"));
      return;
    }
    if (quote && !quote.available) {
      dispatch(addToast("This plan doesn't have a USD price yet — choose Pakistan (PKR)", "error"));
      return;
    }
    if (!proofUrl) {
      dispatch(addToast("Upload a screenshot of your payment receipt", "error"));
      return;
    }
    try {
      await createRequest({ planId, method, reference: reference.trim(), proofUrl, currency }).unwrap();
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
          team will verify it and activate your plan within 24 hours. You&apos;ll see the update
          here once it&apos;s approved.
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
          options={plans.map((p) => ({ value: p.id, label: p.name }))}
        />

        {plan && <PaymentCurrencySelect plan={plan} currency={currency} onChange={changeCurrency} />}

        {quote?.available && <PayToDetails amount={quote.total} currency={currency} />}

        <Select
          label="Paid via"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentRequestMethod)}
          options={currency === "USD" ? PAYMENT_METHODS.filter((m) => m.value === "bank") : PAYMENT_METHODS}
        />
        <Input
          label="Transaction ID / reference number"
          required
          placeholder="e.g. TRX123456789"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
        <ImageUpload
          label="Payment receipt (screenshot) *"
          value={proofUrl}
          onChange={setProofUrl}
        />
        <PaymentHelpLink className="pt-1" />
      </form>
    </Modal>
  );
}
