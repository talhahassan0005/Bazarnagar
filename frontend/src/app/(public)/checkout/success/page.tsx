"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui";
import { useAppDispatch } from "@/store/hooks";
import { clearCart } from "@/store/cartSlice";

/** Shown after a successful online payment (Safepay redirect / mock confirm). */
export default function CheckoutSuccessPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(7);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get("order"));
    dispatch(clearCart());
  }, [dispatch]);

  useEffect(() => {
    if (countdown === 0) { router.push("/"); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 text-center sm:px-6">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf-500/10 text-leaf-600">
        <Check className="h-8 w-8" />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-brand-900">Payment successful</h1>
      <p className="mt-2 text-slate-500">
        Thank you! Your payment went through and your order is confirmed.
        {orderId && (
          <>
            {" "}Order{" "}
            <span className="font-medium text-slate-700">#{orderId.slice(-6).toUpperCase()}</span>.
          </>
        )}{" "}
        The shop will arrange delivery.
      </p>
      <p className="mt-4 text-sm text-slate-400">
        Redirecting to home in{" "}
        <span className="font-semibold text-brand-600">{countdown}</span> seconds…
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button href="/">Go to Home</Button>
        <Button href="/search" variant="outline">Continue shopping</Button>
      </div>
    </div>
  );
}
