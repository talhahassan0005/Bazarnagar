"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { RoleToggle, type AuthRole } from "@/components/auth/RoleToggle";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useSignupSellerMutation, useSignupCustomerMutation } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [role, setRole] = useState<AuthRole>(
    searchParams.get("role") === "seller" ? "seller" : "customer"
  );

  const [signupSeller, { isLoading: sellerLoading }] = useSignupSellerMutation();
  const [signupCustomer, { isLoading: customerLoading }] = useSignupCustomerMutation();
  const isLoading = sellerLoading || customerLoading;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (role === "seller") {
        await signupSeller({ name, phone, email, password }).unwrap();
        dispatch(addToast("Account created — let's set up your store.", "success"));
        router.push("/dashboard/store");
      } else {
        await signupCustomer({ name, phone, email, password }).unwrap();
        dispatch(addToast("Account created!", "success"));
        router.push("/orders");
      }
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Signup failed"), "error"));
    }
  }

  return (
    <AuthCard
      title={role === "seller" ? "Create your store" : "Create your account"}
      subtitle={
        role === "seller"
          ? "Sign up to start selling on Bazaarnagar."
          : "Track your orders and save products you like."
      }
      icon={<UserPlus className="h-5 w-5" />}
      footer={{ text: "Already have an account?", linkText: "Log in", href: `/login?role=${role}` }}
    >
      <RoleToggle role={role} onChange={setRole} />
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input
          label={role === "seller" ? "Seller name" : "Full name"}
          placeholder="Ayesha Khan"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="tel"
          label="Phone number"
          placeholder="0300-1234567"
          required
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
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
          placeholder="Create a password"
          required
          minLength={6}
          autoComplete="new-password"
          hint="At least 6 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
