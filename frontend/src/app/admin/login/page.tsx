"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";
import { BrandMark } from "@/components/layout/Logo";
import { useAppDispatch } from "@/store/hooks";
import { setAdminSession } from "@/store/authSlice";
import { addToast } from "@/store/uiSlice";
import { api, setToken } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

export default function AdminLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, admin } = await api.loginAdmin({ email, password });
      setToken(token);
      dispatch(setAdminSession({ name: admin.name }));
      router.push("/admin");
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Login failed"), "error"));
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-900 px-4">
      {/* Blurred shop/marketplace backdrop (matches seller auth) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center opacity-20 blur-[3px]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop')",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-brand-900/70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,93,44,0.18),_transparent_55%)]" />
      <div className="relative mb-6 flex items-center gap-2.5 text-white">
        <BrandMark className="h-9 w-9" />
        <span className="text-lg font-bold">
          Bazaarnagar <span className="font-normal text-brand-200">Admin</span>
        </span>
      </div>
      <Card className="relative w-full max-w-sm animate-fade-in-up p-6 shadow-2xl sm:p-8">
        <h1 className="text-xl font-bold text-slate-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Restricted access.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="admin@bazaarnagar.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
