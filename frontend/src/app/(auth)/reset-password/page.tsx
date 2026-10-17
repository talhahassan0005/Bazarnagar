"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useResetPasswordMutation } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";

/**
 * New-password screen the reset email links to: `/reset-password?token=…`.
 * The backend verifies the one-time token and sets the new password.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [resetPassword, { isLoading: loading }] = useResetPasswordMutation();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    try {
      const { role } = await resetPassword({ token, password }).unwrap();
      dispatch(addToast("Password updated — please log in.", "success"));
      router.push(role === "seller" ? "/login?role=seller" : "/login");
    } catch (err) {
      setError(getErrorMessage(err, "Could not update your password."));
    }
  }

  if (!token) {
    return (
      <AuthCard
        title="Reset link missing"
        subtitle="This page needs the link from your password reset email."
        footer={{ text: "Remembered it?", linkText: "Back to log in", href: "/login" }}
      >
        <Button href="/forgot-password" fullWidth>
          Request a new link
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before."
      footer={{ text: "Remembered it?", linkText: "Back to log in", href: "/login" }}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          type="password"
          label="New password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          hint="At least 8 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          type="password"
          label="Confirm new password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={error || undefined}
        />
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}
