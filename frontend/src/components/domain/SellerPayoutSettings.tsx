"use client";

import { useEffect, useState } from "react";
import { Banknote, Building2, Check, Smartphone } from "lucide-react";
import { Card, CardBody, CardHeader, Button, Input } from "@/components/ui";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useGetMyStoreQuery, useUpdateStorePayoutMutation } from "@/store/apiSlice";
import { cn, getErrorMessage } from "@/lib/utils";
import type { PayoutMethod } from "@/lib/types";

const METHODS: { id: PayoutMethod; label: string; hint: string; icon: typeof Smartphone }[] = [
  { id: "easypaisa", label: "EasyPaisa", hint: "Mobile wallet", icon: Smartphone },
  { id: "jazzcash", label: "JazzCash", hint: "Mobile wallet", icon: Smartphone },
  { id: "bank", label: "Bank transfer", hint: "Account / IBAN", icon: Building2 },
];

type Values = { method: PayoutMethod; accountTitle: string; accountNumber: string; bankName: string };

/** Settings → Payout details. Seller tells us where to send their earnings. */
export function SellerPayoutSettings() {
  const dispatch = useAppDispatch();
  const { data: store, isLoading } = useGetMyStoreQuery(undefined);
  const [save, { isLoading: saving }] = useUpdateStorePayoutMutation();

  const [v, setV] = useState<Values>({
    method: "easypaisa",
    accountTitle: "",
    accountNumber: "",
    bankName: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});

  // Seed the form once the store loads.
  useEffect(() => {
    if (store?.payout) {
      setV({
        method: store.payout.method,
        accountTitle: store.payout.accountTitle ?? "",
        accountNumber: store.payout.accountNumber ?? "",
        bankName: store.payout.bankName ?? "",
      });
    }
  }, [store]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setV((prev) => ({ ...prev, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const isWallet = v.method === "easypaisa" || v.method === "jazzcash";

  function validate() {
    const e: Partial<Record<keyof Values, string>> = {};
    if (v.accountTitle.trim().length < 2) e.accountTitle = "Enter the account holder's name.";
    if (isWallet) {
      if (!/^03\d{9}$/.test(v.accountNumber.replace(/\D/g, ""))) {
        e.accountNumber = "Enter a valid 11-digit mobile number (03XX-XXXXXXX).";
      }
    } else {
      if (v.accountNumber.replace(/\s/g, "").length < 5) {
        e.accountNumber = "Enter your account number or IBAN.";
      }
      if (v.bankName.trim().length < 2) e.bankName = "Enter the bank name.";
    }
    return e;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    try {
      await save({
        method: v.method,
        accountTitle: v.accountTitle.trim(),
        accountNumber: v.accountNumber.trim(),
        bankName: isWallet ? undefined : v.bankName.trim(),
      }).unwrap();
      dispatch(addToast("Payout details saved.", "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not save payout details"), "error"));
    }
  }

  const saved = store?.payout;

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader
          title="Payout details"
          subtitle="Where should we send your earnings? Choose a method and enter your account."
        />
        <CardBody className="space-y-5">
          {saved && (
            <div className="flex items-center gap-2 rounded-xl border border-leaf-200 bg-leaf-50 px-3 py-2.5 text-sm text-leaf-700">
              <Check className="h-4 w-4" />
              Payouts go to your{" "}
              <span className="font-semibold capitalize">{saved.method}</span> account
              {saved.accountNumber ? ` (${saved.accountNumber})` : ""}.
            </div>
          )}

          {/* Method */}
          <div className="grid gap-2 sm:grid-cols-3">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => set("method", m.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm transition-colors",
                  v.method === m.id
                    ? "border-brand-400 bg-brand-50"
                    : "border-slate-200 hover:bg-slate-50"
                )}
              >
                <m.icon
                  className={cn("h-5 w-5", v.method === m.id ? "text-brand-600" : "text-slate-400")}
                />
                <span>
                  <span className="block font-medium text-slate-800">{m.label}</span>
                  <span className="block text-xs text-slate-400">{m.hint}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Fields */}
          {isLoading ? (
            <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Account title (holder's name)"
                required
                placeholder="Ayesha Khan"
                value={v.accountTitle}
                error={errors.accountTitle}
                onChange={(e) => set("accountTitle", e.target.value)}
              />
              <Input
                label={isWallet ? "Mobile account number" : "Account number / IBAN"}
                required
                inputMode={isWallet ? "numeric" : "text"}
                leftAddon={isWallet ? <Smartphone className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                placeholder={isWallet ? "03XX-XXXXXXX" : "PK00 0000 0000 0000 0000"}
                value={v.accountNumber}
                error={errors.accountNumber}
                onChange={(e) => set("accountNumber", e.target.value)}
              />
              {!isWallet && (
                <Input
                  className="sm:col-span-2"
                  label="Bank name"
                  required
                  placeholder="e.g. Meezan Bank, HBL, UBL"
                  value={v.bankName}
                  error={errors.bankName}
                  onChange={(e) => set("bankName", e.target.value)}
                />
              )}
            </div>
          )}

          <p className="text-xs text-slate-400">
            Online payments (EasyPaisa / JazzCash / card) from customers are collected securely and
            settled to this account. Cash on Delivery orders are collected by you directly.
          </p>

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              Save payout details
            </Button>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
