"use client";

import { useEffect, useState } from "react";
import { Check, CreditCard, ShieldCheck } from "lucide-react";
import { Button, Card, CardBody, CardHeader, Input, Modal, Skeleton } from "@/components/ui";
import { NeedsStore } from "@/components/domain/NeedsStore";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useGetMyStoreQuery, useUpdateStorePaymentMutation } from "@/store/apiSlice";
import { addToast } from "@/store/uiSlice";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

const BENEFITS = [
  "Accept Visa, Mastercard & local cards at checkout",
  "Secure — card details never touch your shop",
  "Automatic payouts to your bank account via Stripe",
];

/** Seller payment-methods settings — connect a Stripe account to accept cards. */
export function StripePaymentSettings() {
  const dispatch = useAppDispatch();
  const sellerId = useAppSelector((s) => s.auth.sellerId) ?? undefined;
  const { data: store, isLoading, refetch } = useGetMyStoreQuery(sellerId);
  const [updatePayment, { isLoading: saving }] = useUpdateStorePaymentMutation();

  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [email, setEmail] = useState("");
  const [connecting, setConnecting] = useState(false);

  // After returning from Stripe onboarding (?stripe=return), refresh the status.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe") === "return") {
      window.history.replaceState(null, "", "/dashboard/settings");
      api
        .stripeStatus()
        .then(() => refetch())
        .catch(() => {});
    }
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    );
  }

  if (!store) {
    return <NeedsStore message="Create your store profile before setting up payments." />;
  }

  const stripe = store.stripe;
  const connected = !!stripe?.connected;

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updatePayment({
        connected: true,
        accountId: accountId.trim(),
        email: email.trim(),
      }).unwrap();
      dispatch(addToast("Stripe connected", "success"));
      setOpen(false);
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not connect Stripe"), "error"));
    }
  }

  async function disconnect() {
    try {
      await updatePayment({ connected: false }).unwrap();
      dispatch(addToast("Stripe disconnected", "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not disconnect"), "error"));
    }
  }

  /** Real Stripe Connect onboarding — redirects to Stripe. Falls back to
   *  manual entry if Stripe isn't configured on the server yet. */
  async function connectWithStripe() {
    setConnecting(true);
    try {
      const { url } = await api.stripeOnboard();
      window.location.href = url;
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not start Stripe onboarding"), "error"));
      setConnecting(false);
      setOpen(true);
    }
  }

  return (
    <>
      <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-md hover:shadow-brand-900/5">
        {/* Stripe header strip */}
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 transition-transform duration-300 hover:scale-105">
              <CreditCard className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Stripe</p>
              <p className="text-sm text-slate-500">Card payments · Visa, Mastercard & more</p>
            </div>
          </div>
          {connected ? (
            <span className="inline-flex animate-fade-in items-center gap-1.5 self-start rounded-full bg-leaf-500/15 px-3 py-1 text-sm font-medium text-leaf-700">
              <Check className="h-4 w-4" /> Connected
            </span>
          ) : (
            <span className="inline-flex items-center self-start rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500">
              Not connected
            </span>
          )}
        </div>

        <CardBody className="space-y-4">
          {connected ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Account ID</p>
                  <p className="truncate text-sm font-medium text-slate-800">
                    {stripe?.accountId || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Account email</p>
                  <p className="truncate text-sm font-medium text-slate-800">
                    {stripe?.email || "—"}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Customers can pay by card at checkout. Payouts are sent to your bank by Stripe.
                Cash on Delivery stays available too.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAccountId(stripe?.accountId ?? "");
                    setEmail(stripe?.email ?? "");
                    setOpen(true);
                  }}
                >
                  Update details
                </Button>
                <Button variant="danger" loading={saving} onClick={disconnect}>
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Connect your Stripe account to accept online card payments at checkout — in
                addition to Cash on Delivery.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                {BENEFITS.map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    {t}
                  </li>
                ))}
              </ul>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                leftIcon={<CreditCard className="h-4 w-4" />}
                loading={connecting}
                onClick={connectWithStripe}
              >
                Connect with Stripe
              </Button>
            </>
          )}
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader
          title="How payouts work"
          subtitle="Once connected, online card payments settle to your Stripe balance and pay out to your bank on Stripe's schedule. You can disconnect anytime — Cash on Delivery is always available."
        />
      </Card>

      {/* Connect / update modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={connected ? "Update Stripe details" : "Connect Stripe"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              form="stripe-form"
              type="submit"
              loading={saving}
              leftIcon={<CreditCard className="h-4 w-4" />}
            >
              {connected ? "Save" : "Connect"}
            </Button>
          </>
        }
      >
        <form id="stripe-form" onSubmit={connect} className="space-y-4">
          <p className="text-sm text-slate-500">
            Link your Stripe account to your shop. You can find your account ID in your Stripe
            dashboard (Settings → Account).
          </p>
          <Input
            label="Stripe account ID"
            required
            placeholder="acct_1AbCdEf…"
            hint="Starts with acct_"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
          <Input
            type="email"
            label="Account email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </form>
      </Modal>
    </>
  );
}
