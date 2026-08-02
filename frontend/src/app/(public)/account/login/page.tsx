"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useLoginCustomerMutation } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";

export default function CustomerLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loginCustomer, { isLoading }] = useLoginCustomerMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await loginCustomer({ email, password }).unwrap();
      dispatch(addToast("Welcome back!", "success"));
      router.push("/orders");
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Login failed"), "error"));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-14 sm:px-6">
      <AuthCard
        title="Log in"
        subtitle="Access your order history and wishlist."
        footer={{ text: "New here?", linkText: "Create an account", href: "/account/signup" }}
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
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}
