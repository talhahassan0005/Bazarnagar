"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAppDispatch } from "@/store/hooks";
import { setSellerSession } from "@/store/authSlice";
import { addToast } from "@/store/uiSlice";
import { api, setToken } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, seller } = await api.signupSeller({ name, phone, email, password });
      setToken(token);
      dispatch(setSellerSession(seller));
      dispatch(addToast("Account created — let's set up your store.", "success"));
      router.push("/dashboard/store");
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Signup failed"), "error"));
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your store"
      subtitle="Sign up to start selling on Bazaarnagar."
      footer={{ text: "Already have an account?", linkText: "Log in", href: "/login" }}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Seller name"
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
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
