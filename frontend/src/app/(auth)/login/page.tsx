"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { RoleToggle, type AuthRole } from "@/components/auth/RoleToggle";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useLoginSellerMutation, useLoginCustomerMutation } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [role, setRole] = useState<AuthRole>(
    searchParams.get("role") === "seller" ? "seller" : "customer"
  );

  const [loginSeller, { isLoading: sellerLoading }] = useLoginSellerMutation();
  const [loginCustomer, { isLoading: customerLoading }] = useLoginCustomerMutation();
  const isLoading = sellerLoading || customerLoading;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (role === "seller") {
        await loginSeller({ email, password }).unwrap();
        dispatch(addToast("Welcome back!", "success"));
        router.push("/dashboard");
      } else {
        await loginCustomer({ email, password }).unwrap();
        dispatch(addToast("Welcome back!", "success"));
        router.push("/orders");
      }
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Login failed"), "error"));
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle={role === "seller" ? "Log in to manage your shop and products." : "Log in to see your orders and wishlist."}
      icon={<LogIn className="h-5 w-5" />}
      footer={{
        text: "New to Bazaarnagar?",
        linkText: role === "seller" ? "Create a store" : "Create an account",
        href: `/signup?role=${role}`,
      }}
    >
      <RoleToggle role={role} onChange={setRole} />
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {role === "seller" && (
            <div className="mt-1.5 flex justify-end">
              <a href="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
                Forgot password?
              </a>
            </div>
          )}
        </div>
        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthCard>
  );
}
