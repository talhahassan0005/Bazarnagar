"use client";

import { useState } from "react";
import { Rocket } from "lucide-react";
import { Button, Input, Modal, Select } from "@/components/ui";
import { ImageUpload } from "@/components/domain/ImageUpload";
import { PAYMENT_METHODS, PayToDetails } from "@/components/domain/ManualPaymentModal";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useBoostProductMutation, useGetBoostPricingQuery } from "@/store/apiSlice";
import { DEFAULT_BOOST_PRICING } from "@/lib/constants";
import { cn, formatPrice, getErrorMessage, isBoosted } from "@/lib/utils";
import type { PaymentRequestMethod, Product } from "@/lib/types";

const QUICK_DAYS = [3, 7, 15, 30];

/**
 * Seller pays per day to feature a product. Open to every plan; the boost
 * starts as soon as the payment details are submitted.
 */
export function BoostModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { data: pricing = DEFAULT_BOOST_PRICING } = useGetBoostPricingQuery();
  const [boostProduct, { isLoading }] = useBoostProductMutation();

  const [days, setDays] = useState(7);
  const [method, setMethod] = useState<PaymentRequestMethod>("jazzcash");
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const validDays = Number.isInteger(days) && days >= pricing.minDays && days <= pricing.maxDays;
  const total = validDays ? days * pricing.pricePerDay : null;
  const quickDays = QUICK_DAYS.filter((d) => d >= pricing.minDays && d <= pricing.maxDays);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validDays) return;
    try {
      await boostProduct({
        id: product.id,
        days,
        method,
        reference: reference.trim(),
        proofUrl: proofUrl || undefined,
      }).unwrap();
      dispatch(addToast(`"${product.name}" is now featured for ${days} day${days === 1 ? "" : "s"}`, "success"));
      onClose();
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not feature product"), "error"));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isBoosted(product) ? "Extend featured" : "Feature this product"}
      footer={
        <>
          <Button variant="outline" disabled={isLoading} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="boost-form"
            loading={isLoading}
            disabled={!validDays}
            leftIcon={<Rocket className="h-4 w-4" />}
          >
            {total != null ? `Pay ${formatPrice(total)} & feature` : "Feature now"}
          </Button>
        </>
      }
    >
      <form id="boost-form" onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Featured products appear <span className="font-medium">first</span> in search and store
          listings with a ★ Featured tag. It costs{" "}
          <span className="font-semibold text-slate-900">{formatPrice(pricing.pricePerDay)} per day</span>.
        </p>

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">How many days?</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {quickDays.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  days === d
                    ? "border-amber-400 bg-amber-50 font-medium text-amber-800"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                {d} days
              </button>
            ))}
          </div>
          <Input
            type="number"
            min={pricing.minDays}
            max={pricing.maxDays}
            step={1}
            value={Number.isNaN(days) ? "" : days}
            onChange={(e) => setDays(e.target.valueAsNumber)}
            error={validDays ? undefined : `Choose ${pricing.minDays}–${pricing.maxDays} days`}
            hint={`${pricing.minDays}–${pricing.maxDays} days`}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-sm">
          <span className="text-amber-900">
            {validDays ? `${days} day${days === 1 ? "" : "s"} × ${formatPrice(pricing.pricePerDay)}` : "Total"}
          </span>
          <span className="text-lg font-bold text-amber-900">{total != null ? formatPrice(total) : "—"}</span>
        </div>

        <PayToDetails amount={total} />

        <Select
          label="Paid via"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentRequestMethod)}
          options={PAYMENT_METHODS}
        />
        <Input
          label="Transaction ID / reference number"
          required
          minLength={3}
          placeholder="e.g. TRX123456789"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
        <ImageUpload label="Payment screenshot (optional)" value={proofUrl} onChange={setProofUrl} />
        <p className="text-xs text-slate-500">
          Your product is featured as soon as you submit. Payments are checked by our team —
          a payment that can&apos;t be found will be cancelled and the feature removed.
        </p>
      </form>
    </Modal>
  );
}
