"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAppDispatch } from "@/store/hooks";
import { loginSeller } from "@/store/authSlice";
import { addToast } from "@/store/uiSlice";
import { CURRENT_SELLER_ID } from "@/lib/mockData";

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Prototype: account creation is mocked — start a session and set up the store.
    dispatch(loginSeller(CURRENT_SELLER_ID));
    dispatch(addToast("Account created — let's set up your store.", "success"));
    setTimeout(() => router.push("/dashboard/store"), 600);
  }

  return (
    <AuthCard
      title="Create your store"
      subtitle="Sign up to start selling on Bazaarnagar."
      footer={{ text: "Already have an account?", linkText: "Log in", href: "/login" }}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Seller name" placeholder="Ayesha Khan" required />
        <Input
          type="tel"
          label="Phone number"
          placeholder="0300-1234567"
          required
          autoComplete="tel"
        />
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
          placeholder="Create a password"
          required
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
