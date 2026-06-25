"use client";

import { useState } from "react";
import { Button, Input, Modal, Select, Textarea, Toggle } from "@/components/ui";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import {
  useGetSellerPaymentsQuery,
  useRecordPaymentMutation,
  useUpdateSellerMutation,
} from "@/store/apiSlice";
import { PLAN_LIST, PLANS } from "@/lib/constants";
import { formatPrice, getErrorMessage } from "@/lib/utils";
import type { PlanId, Seller, SubscriptionStatus } from "@/lib/types";

const SUB_STATUSES: SubscriptionStatus[] = [
  "trial",
  "active",
  "expired",
  "suspended",
  "cancelled",
];

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank transfer" },
  { value: "easypaisa", label: "EasyPaisa" },
  { value: "jazzcash", label: "JazzCash" },
];

/** Admin modal to change a seller's plan/subscription and record payments. */
export function ManageSellerModal({
  seller,
  onClose,
}: {
  seller: Seller;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const [updateSeller, { isLoading: saving }] = useUpdateSellerMutation();
  const [recordPayment, { isLoading: recording }] = useRecordPaymentMutation();
  const { data: payments } = useGetSellerPaymentsQuery(seller.id);

  const [planId, setPlanId] = useState<PlanId>(seller.planId);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(
    seller.subscriptionStatus
  );

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [notes, setNotes] = useState("");
  const [applyToSeller, setApplyToSeller] = useState(true);

  async function saveSubscription() {
    try {
      await updateSeller({ id: seller.id, planId, subscriptionStatus }).unwrap();
      dispatch(addToast(`Updated subscription for ${seller.name}`, "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Update failed"), "error"));
    }
  }

  async function submitPayment() {
    if (!amount || !method) {
      dispatch(addToast("Enter an amount and payment method", "error"));
      return;
    }
    try {
      await recordPayment({
        sellerId: seller.id,
        planId,
        amount: Number(amount),
        method,
        paidAt: paidAt || undefined,
        notes: notes || undefined,
        applyToSeller,
        subscriptionStatus: applyToSeller ? subscriptionStatus : undefined,
      }).unwrap();
      dispatch(addToast("Payment recorded", "success"));
      setAmount("");
      setMethod("");
      setPaidAt("");
      setNotes("");
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not record payment"), "error"));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Manage — ${seller.name}`}
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Plan & subscription */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Plan"
              value={planId}
              onChange={(e) => setPlanId(e.target.value as PlanId)}
              options={PLAN_LIST.map((p) => ({
                value: p.id,
                label: `${p.name} — ${formatPrice(p.price)}/mo`,
              }))}
            />
            <Select
              label="Subscription status"
              value={subscriptionStatus}
              onChange={(e) => setSubscriptionStatus(e.target.value as SubscriptionStatus)}
              options={SUB_STATUSES.map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              }))}
            />
          </div>
          <Button size="sm" onClick={saveSubscription} disabled={saving}>
            {saving ? "Saving…" : "Save plan & status"}
          </Button>
        </div>

        {/* Record payment */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="mb-3 text-sm font-medium text-slate-700">Record payment</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Amount (Rs.)"
              type="number"
              min={0}
              placeholder="500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label="Date"
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
            <Select
              label="Method"
              placeholder="Select"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              options={METHODS}
            />
            <div className="flex items-end pb-1">
              <Toggle
                label="Apply plan to seller"
                checked={applyToSeller}
                onChange={setApplyToSeller}
              />
            </div>
            <Textarea
              className="col-span-2"
              label="Notes"
              rows={2}
              placeholder="Optional notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button size="sm" className="mt-3" onClick={submitPayment} disabled={recording}>
            {recording ? "Recording…" : "Record payment"}
          </Button>
        </div>

        {/* History */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Payment history</p>
          {!payments || payments.length === 0 ? (
            <p className="text-sm text-slate-400">No payments recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-slate-800">{formatPrice(p.amount)}</span>
                    <span className="text-slate-400">
                      {" "}
                      · {PLANS[p.planId]?.name ?? p.planId} · {p.method}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(p.paidAt).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
