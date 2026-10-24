"use client";

import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useResendVerificationMutation } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";

/** "Check your inbox" box shown after seller signup, or when an unverified seller tries to log in. */
export function VerifyEmailNotice({ email, title = "Check your email" }: { email: string; title?: string }) {
  const dispatch = useAppDispatch();
  const [resend, { isLoading }] = useResendVerificationMutation();

  async function onResend() {
    try {
      await resend({ email }).unwrap();
      dispatch(addToast("Verification email sent again.", "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not send the email"), "error"));
    }
  }

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm">
        <MailCheck className="h-6 w-6" />
      </span>
      <p className="mt-3 font-semibold text-brand-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">
        We sent a verification link to <strong className="break-all">{email}</strong>. Click{" "}
        <strong>Verify my email</strong> in that email to activate your seller account. You&apos;ll be logged in
        automatically.
      </p>
      <p className="mt-2 text-xs text-slate-500">Not there? Check your spam or promotions folder.</p>
      <Button variant="outline" size="sm" className="mt-4" loading={isLoading} onClick={onResend}>
        Resend email
      </Button>
    </div>
  );
}
