"use client";

import { useState } from "react";
import { Check, Landmark, X } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, Input, TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import {
  useGetAllPaymentRequestsQuery,
  useGetManualPaymentSettingsQuery,
  useReviewPaymentRequestMutation,
  useUpdateManualPaymentSettingsMutation,
} from "@/store/apiSlice";
import { formatMoney, getErrorMessage } from "@/lib/utils";
import { PLANS } from "@/lib/constants";
import type { ManualPaymentSettings, PaymentRequest } from "@/lib/types";

/** What the payment was for, e.g. "Plan 1 plan" or "Boost: Yoga Mat · 7 days". */
function describe(r: PaymentRequest): string {
  if (r.purpose === "boost") {
    return `Boost: ${r.productName ?? "product"} · ${r.days} day${r.days === 1 ? "" : "s"}`;
  }
  return `${(r.planId && PLANS[r.planId]?.name) || r.planId} plan`;
}

function StatusBadge({ status }: { status: PaymentRequest["status"] }) {
  if (status === "approved") return <Badge tone="green">Approved</Badge>;
  if (status === "rejected") return <Badge tone="red">Rejected</Badge>;
  return <Badge tone="amber">Pending</Badge>;
}

function SettingsForm() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetManualPaymentSettingsQuery();
  const [update, { isLoading: saving }] = useUpdateManualPaymentSettingsMutation();
  const [form, setForm] = useState<ManualPaymentSettings | null>(null);

  const values = form ?? data ?? {};
  const set = (key: keyof ManualPaymentSettings, value: string) =>
    setForm({ ...values, [key]: value });

  async function save() {
    try {
      await update(values).unwrap();
      dispatch(addToast("Payment details updated", "success"));
      setForm(null);
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not save"), "error"));
    }
  }

  if (isLoading) return null;

  return (
    <Card className="mb-6">
      <CardHeader title="Manual payment details" subtitle="Pakistan: bank transfer, JazzCash or EasyPaisa. Outside Pakistan: the Payoneer US account." />
      <CardBody className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Bank name" value={values.bankName ?? ""} onChange={(e) => set("bankName", e.target.value)} />
          <Input label="Account title" value={values.bankAccountTitle ?? ""} onChange={(e) => set("bankAccountTitle", e.target.value)} />
          <Input label="Account number / IBAN" value={values.bankAccountNumber ?? ""} onChange={(e) => set("bankAccountNumber", e.target.value)} />
          <Input label="JazzCash number" value={values.jazzcashNumber ?? ""} onChange={(e) => set("jazzcashNumber", e.target.value)} />
          <Input label="EasyPaisa number" value={values.easypaisaNumber ?? ""} onChange={(e) => set("easypaisaNumber", e.target.value)} />
        </div>
        <Input
          label="Extra instructions (optional)"
          value={values.instructions ?? ""}
          onChange={(e) => set("instructions", e.target.value)}
        />
        <p className="pt-2 text-sm font-semibold text-slate-800">USD payments from outside Pakistan (Payoneer)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Beneficiary name" value={values.usdBeneficiaryName ?? ""} onChange={(e) => set("usdBeneficiaryName", e.target.value)} />
          <Input label="Bank name" value={values.usdBankName ?? ""} onChange={(e) => set("usdBankName", e.target.value)} />
          <Input label="Bank address" value={values.usdBankAddress ?? ""} onChange={(e) => set("usdBankAddress", e.target.value)} />
          <Input label="Routing (ABA)" value={values.usdRoutingNumber ?? ""} onChange={(e) => set("usdRoutingNumber", e.target.value)} />
          <Input label="SWIFT code" value={values.usdSwiftCode ?? ""} onChange={(e) => set("usdSwiftCode", e.target.value)} />
          <Input label="Account number" value={values.usdAccountNumber ?? ""} onChange={(e) => set("usdAccountNumber", e.target.value)} />
          <Input label="Account type" value={values.usdAccountType ?? ""} onChange={(e) => set("usdAccountType", e.target.value)} />
          <Input
            label="Payoneer payment link (optional)"
            placeholder="https://…"
            value={values.payoneerLink ?? ""}
            onChange={(e) => set("payoneerLink", e.target.value)}
          />
        </div>
        <Button size="sm" loading={saving} onClick={save}>Save details</Button>
      </CardBody>
    </Card>
  );
}

export default function AdminPaymentRequestsPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetAllPaymentRequestsQuery();
  const [review, { isLoading: reviewing }] = useReviewPaymentRequestMutation();
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  async function act(id: string, status: "approved" | "rejected") {
    setReviewingId(id);
    try {
      await review({ id, status }).unwrap();
      dispatch(addToast(status === "approved" ? "Payment approved — plan activated" : "Payment rejected", "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not update request"), "error"));
    } finally {
      setReviewingId(null);
    }
  }

  const requests = data ?? [];
  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  return (
    <>
      <PageHeader
        title="Manual Payment Requests"
        description="Bank transfer / JazzCash / EasyPaisa payments for plans (approve to activate) and boosts (already live — verify or reject)."
      />

      <SettingsForm />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Pending ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="text-sm text-slate-400">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {pending.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-3">
                        {r.proofUrl && (
                          <a href={r.proofUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <img
                              src={r.proofUrl}
                              alt="Payment screenshot"
                              className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                            />
                          </a>
                        )}
                        <div>
                          <p className="flex items-center gap-2 font-medium text-slate-800">
                            <Landmark className="h-4 w-4 text-slate-400" />
                            {r.sellerName} <span className="text-slate-400">· {r.sellerEmail}</span>
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {describe(r)} — {formatMoney(r.amount, r.currency)}{r.taxAmount ? ` (incl. ${formatMoney(r.taxAmount, r.currency)} tax)` : ""} via {r.method}
                          </p>
                          {r.purpose === "boost" && (
                            <p className="mt-1 text-xs font-medium text-amber-700">
                              Boost is already live — verify the payment arrived, or reject to remove it.
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-slate-400">Ref: {r.reference}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {new Date(r.createdAt).toLocaleString("en-PK")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          leftIcon={<Check className="h-3.5 w-3.5" />}
                          loading={reviewing && reviewingId === r.id}
                          onClick={() => act(r.id, "approved")}
                        >
                          {r.purpose === "boost" ? "Verify payment" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<X className="h-3.5 w-3.5" />}
                          loading={reviewing && reviewingId === r.id}
                          onClick={() => act(r.id, "rejected")}
                        >
                          {r.purpose === "boost" ? "Reject & remove boost" : "Reject"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {reviewed.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">History</h2>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                        <th className="px-4 py-3">Seller</th>
                        <th className="px-4 py-3">For</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Proof</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reviewed.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-3">{r.sellerName}</td>
                          <td className="px-4 py-3">{describe(r)}</td>
                          <td className="px-4 py-3">{formatMoney(r.amount, r.currency)}</td>
                          <td className="px-4 py-3">
                            {r.proofUrl ? (
                              <a href={r.proofUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={r.proofUrl}
                                  alt="Payment screenshot"
                                  className="h-10 w-10 rounded-md border border-slate-200 object-cover"
                                />
                              </a>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                          <td className="px-4 py-3 text-slate-400">
                            {new Date(r.createdAt).toLocaleDateString("en-PK")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </>
  );
}
