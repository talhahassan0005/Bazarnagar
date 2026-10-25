"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { RoleToggle, type AuthRole } from "@/components/auth/RoleToggle";
import { VerifyEmailNotice } from "@/components/auth/VerifyEmailNotice";
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
  /** Seller whose email isn't verified yet: show the resend box instead of a toast. */
  const [unverified, setUnverified] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUnverified(null);
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
      if ((err as { data?: { code?: string } })?.data?.code === "EMAIL_NOT_VERIFIED") {
        setUnverified(email.trim().toLowerCase());
        return;
      }
      dispatch(addToast(getErrorMessage(err, "Login failed"), "error"));
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle={role === "seller" ? "Log in to manage your shop and products." : "Log in to see your orders and wishlist."}
      icon={<Lock className="h-5 w-5" />}
      footer={{
        text: "New to Bazarnagar?",
        linkText: role === "seller" ? "Create a store" : "Create an account",
        href: `/signup?role=${role}`,
      }}
    >
      <RoleToggle role={role} onChange={setRole} />
      {unverified && role === "seller" && (
        <div className="mt-6">
          <VerifyEmailNotice email={unverified} title="Verify your email to log in" />
        </div>
      )}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          leftAddon={<Mail className="h-4 w-4" />}
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
            leftAddon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="mt-1.5 flex justify-end">
            <a href="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
              Forgot password?
            </a>
          </div>
        </div>
        <Button type="submit" fullWidth size="lg" disabled={isLoading}>
          {isLoading ? "Logging in…" : "Log in"}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your information is encrypted and secure.
        </p>
      </form>
    </AuthCard>
  );
}
