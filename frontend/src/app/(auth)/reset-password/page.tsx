"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";

/**
 * New-password screen the (mock) reset email links to, e.g.
 * `/reset-password?token=…`. The token would be read from the URL and verified
 * by the backend; for the prototype we just validate and simulate success.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onSubmit(e: React.FormEvent) {
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
    setLoading(true);
    // Prototype: no backend — simulate the reset, then send them to log in.
    setTimeout(() => {
      dispatch(addToast("Password updated — please log in.", "success"));
      router.push("/login");
    }, 600);
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
