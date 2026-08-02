"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useSignupCustomerMutation } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";

export default function CustomerSignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [signupCustomer, { isLoading }] = useSignupCustomerMutation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signupCustomer({ name, phone, email, password }).unwrap();
      dispatch(addToast("Account created!", "success"));
      router.push("/orders");
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Signup failed"), "error"));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-14 sm:px-6">
      <AuthCard
        title="Create your account"
        subtitle="Track your orders and save products you like."
        footer={{ text: "Already have an account?", linkText: "Log in", href: "/account/login" }}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Full name"
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
    </div>
  );
}
