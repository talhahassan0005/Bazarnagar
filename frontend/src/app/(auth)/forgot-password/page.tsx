"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useForgotPasswordMutation } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading: loading }] = useForgotPasswordMutation();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await forgotPassword({ email: email.trim() }).unwrap();
      setSent(true);
      dispatch(addToast("Reset link sent", "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not send the reset link"), "error"));
    }
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle={`If an account exists for ${email}, we've sent a link to reset your password.`}
        footer={{ text: "Remembered it?", linkText: "Back to log in", href: "/login" }}
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf-500/10 text-leaf-600">
            <Check className="h-6 w-6" />
          </span>
          <p className="text-sm text-slate-500">
            The link expires in 30 minutes. Didn’t get it? Check your spam folder or try again.
          </p>
          <Button variant="outline" fullWidth onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={{ text: "Remembered it?", linkText: "Back to log in", href: "/login" }}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  );
}
