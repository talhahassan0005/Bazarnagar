"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui";
import { useAppDispatch } from "@/store/hooks";
import { clearCart } from "@/store/cartSlice";

/** Shown after a successful Stripe card payment (success_url). */
export default function CheckoutSuccessPage() {
  const dispatch = useAppDispatch();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get("order"));
    // Payment succeeded → clear the cart.
    dispatch(clearCart());
  }, [dispatch]);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 text-center sm:px-6">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf-500/10 text-leaf-600">
        <Check className="h-8 w-8" />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-brand-900">Payment successful</h1>
      <p className="mt-2 text-slate-500">
        Thank you! Your card payment went through and your order is confirmed.
        {orderId && (
          <>
            {" "}
            Order{" "}
            <span className="font-medium text-slate-700">
              #{orderId.slice(-6).toUpperCase()}
            </span>
            .
          </>
        )}{" "}
        The shop will arrange delivery.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button href="/search">Continue shopping</Button>
        <Button href="/shops" variant="outline">
          Browse shops
        </Button>
      </div>
    </div>
  );
}
