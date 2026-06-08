"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAppDispatch } from "@/store/hooks";
import { loginSeller } from "@/store/authSlice";
import { addToast } from "@/store/uiSlice";
import { CURRENT_SELLER_ID } from "@/lib/mockData";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Prototype: no real auth yet — set the session and go to the dashboard.
    dispatch(loginSeller(CURRENT_SELLER_ID));
    dispatch(addToast("Welcome back!", "success"));
    setTimeout(() => router.push("/dashboard"), 500);
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to manage your shop and products."
      footer={{ text: "New to Bazaarnagar?", linkText: "Create a store", href: "/signup" }}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthCard>
  );
}
