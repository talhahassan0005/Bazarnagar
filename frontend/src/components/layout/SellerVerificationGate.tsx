"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Clock, LogOut, ShieldCheck } from "lucide-react";
import { Button, Card, CardBody } from "@/components/ui";
import { ImageUpload } from "@/components/domain/ImageUpload";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { logout } from "@/store/authSlice";
import { clearToken } from "@/lib/api";
import { useGetSellerQuery, useSubmitKycMutation } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";
import type { Seller } from "@/lib/types";

/**
 * Shown instead of the normal dashboard while a seller's account is
 * "pending" — collects CNIC front/back for KYC, then waits for an admin to
 * review and approve before the real dashboard becomes reachable.
 */
export function SellerVerificationGate({ seller }: { seller: Seller }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { refetch, isFetching } = useGetSellerQuery();
  const [submitKyc, { isLoading: submitting }] = useSubmitKycMutation();

  const [cnicFront, setCnicFront] = useState(seller.kycCnicFront ?? "");
  const [cnicBack, setCnicBack] = useState(seller.kycCnicBack ?? "");

  const submitted = Boolean(seller.kycSubmittedAt);

  function handleLogout() {
    clearToken();
    dispatch(logout());
    router.push("/login?role=seller");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await submitKyc({ cnicFront, cnicBack }).unwrap();
      dispatch(addToast("Documents submitted — we'll review them shortly.", "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not submit documents"), "error"));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-lg p-7 sm:p-9">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-900/25">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify your account</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          {submitted
            ? "Your documents are being reviewed by our team. This usually takes a few hours."
            : "Upload your CNIC so we can verify your identity before your shop goes live."}
        </p>

        {seller.kycRejectionReason && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Your last submission was rejected: <strong>{seller.kycRejectionReason}</strong>. Please
              upload clear photos and try again.
            </span>
          </div>
        )}

        {submitted && !seller.kycRejectionReason ? (
          <CardBody className="mt-5 flex flex-col items-center gap-3 rounded-xl bg-slate-50 px-4 py-6 text-center">
            <Clock className="h-6 w-6 text-slate-400" />
            <p className="text-sm text-slate-500">
              Submitted on {new Date(seller.kycSubmittedAt!).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}.
            </p>
            <Button size="sm" variant="outline" loading={isFetching} onClick={() => refetch()}>
              Check status
            </Button>
          </CardBody>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <ImageUpload label="CNIC — front side" required value={cnicFront} onChange={setCnicFront} />
            <ImageUpload label="CNIC — back side" required value={cnicBack} onChange={setCnicBack} />
            <Button type="submit" fullWidth disabled={submitting || !cnicFront || !cnicBack}>
              {submitting ? "Submitting…" : "Submit for review"}
            </Button>
          </form>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-600"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </button>
      </Card>
    </div>
  );
}
