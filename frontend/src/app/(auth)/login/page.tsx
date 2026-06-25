"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAppDispatch } from "@/store/hooks";
import { setSellerSession } from "@/store/authSlice";
import { addToast } from "@/store/uiSlice";
import { api, setToken } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, seller } = await api.loginSeller({ email, password });
      setToken(token);
      dispatch(setSellerSession(seller));
      dispatch(addToast("Welcome back!", "success"));
      router.push("/dashboard");
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Login failed"), "error"));
      setLoading(false);
    }
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
          <div className="mt-1.5 flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthCard>
  );
}
