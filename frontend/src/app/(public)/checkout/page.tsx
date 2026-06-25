"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Banknote, Check, CreditCard, MessageCircle, ShoppingCart } from "lucide-react";
import { Button, EmptyState, Input, Select, Textarea } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCart, selectCartItems } from "@/store/cartSlice";
import { addToast } from "@/store/uiSlice";
import {
  useCreateCheckoutMutation,
  useCreateOrderMutation,
  useGetStoreBySlugQuery,
} from "@/store/apiSlice";
import { CITIES } from "@/lib/constants";
import { formatPrice, getErrorMessage, toWhatsAppNumber } from "@/lib/utils";
import type { CartItem, Order } from "@/lib/types";

interface StoreGroup {
  storeId: string;
  storeName: string;
  whatsapp: string;
  items: CartItem[];
}

/** Group cart items into one order per store. */
function groupByStore(items: CartItem[]): StoreGroup[] {
  const map = new Map<string, StoreGroup>();
  for (const item of items) {
    const g = map.get(item.storeId);
    if (g) g.items.push(item);
    else
      map.set(item.storeId, {
        storeId: item.storeId,
        storeName: item.storeName,
        whatsapp: item.whatsapp,
        items: [item],
      });
  }
  return [...map.values()];
}

const groupTotal = (g: StoreGroup) =>
  g.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [createCheckout, { isLoading: cardLoading }] = useCreateCheckoutMutation();

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerCity: "",
    note: "",
  });
  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const [placed, setPlaced] = useState<{ groups: StoreGroup[]; orders: Order[] } | null>(null);
  const [method, setMethod] = useState<"cod" | "card">("cod");

  const groups = groupByStore(items);
  const singleStore = groups.length === 1 ? groups[0]! : null;

  // Card payment (Stripe) is only offered for a single, Stripe-connected shop.
  const { data: singleStoreData } = useGetStoreBySlugQuery(
    singleStore?.items[0]?.storeSlug ?? "",
    { skip: !singleStore }
  );
  const cardAvailable = Boolean(singleStoreData?.stripe?.chargesEnabled);

  useEffect(() => {
    if (!cardAvailable && method === "card") setMethod("cod");
  }, [cardAvailable, method]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Card → create a Stripe Checkout Session and redirect to Stripe.
    if (method === "card" && singleStore) {
      try {
        const { url } = await createCheckout({
          storeId: singleStore.storeId,
          ...form,
          items: singleStore.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }).unwrap();
        window.location.href = url;
      } catch (err) {
        dispatch(addToast(getErrorMessage(err, "Could not start card payment"), "error"));
      }
      return;
    }

    try {
      const orders: Order[] = [];
      for (const g of groups) {
        const order = await createOrder({
          storeId: g.storeId,
          ...form,
          items: g.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }).unwrap();
        orders.push(order);
      }
      setPlaced({ groups, orders });
      dispatch(clearCart());
    } catch (err) {
      dispatch(
        addToast(getErrorMessage(err, "Could not place order"), "error")
      );
    }
  }

  // ---- Confirmation ----
  if (placed) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-leaf-500/10 text-leaf-600">
            <Check className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-brand-900">Order placed!</h1>
          <p className="mt-1 text-slate-500">
            {placed.orders.length === 1
              ? "Your order has been sent to the shop."
              : `${placed.orders.length} orders sent to ${placed.orders.length} shops.`}{" "}
            They’ll confirm and arrange delivery.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {placed.orders.map((order, i) => {
            const g = placed.groups[i]!;
            const message = [
              `Hi ${g.storeName}, I placed an order on Bazaarnagar.`,
              `Order #${order.id.slice(-6).toUpperCase()}`,
              ...g.items.map((it) => `• ${it.name} × ${it.quantity}`),
              `Total: ${formatPrice(order.total)}`,
              `Name: ${form.customerName}`,
              `Address: ${form.customerAddress}, ${form.customerCity}`,
            ].join("\n");
            return (
              <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">{g.storeName}</p>
                  <span className="text-xs text-slate-400">
                    #{order.id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                  {g.items.map((it) => (
                    <li key={it.productId} className="flex justify-between">
                      <span>
                        {it.name} × {it.quantity}
                      </span>
                      <span>{formatPrice(it.price * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatPrice(order.total)}
                  </span>
                  <Button
                    href={`https://wa.me/${toWhatsAppNumber(g.whatsapp)}?text=${encodeURIComponent(message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="whatsapp"
                    size="sm"
                    leftIcon={<MessageCircle className="h-4 w-4" />}
                  >
                    Notify on WhatsApp
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button href="/search" variant="outline">
            Continue shopping
          </Button>
        </div>
      </div>
    );
  }

  // ---- Empty cart ----
  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" />}
          title="Your cart is empty"
          description="Add some products before checking out."
          action={<Button href="/search">Browse products</Button>}
        />
      </div>
    );
  }

  // ---- Checkout form ----
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-brand-900">Checkout</h1>
      <p className="mt-1 text-sm text-slate-500">
        No account needed — just your delivery details. Pay by Cash on Delivery or card.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Delivery form */}
        <form
          id="checkout-form"
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <h2 className="font-semibold text-slate-800">Delivery details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              required
              value={form.customerName}
              onChange={(e) => set("customerName", e.target.value)}
            />
            <Input
              label="Phone number"
              type="tel"
              required
              placeholder="0300-1234567"
              value={form.customerPhone}
              onChange={(e) => set("customerPhone", e.target.value)}
            />
            <Select
              label="City"
              required
              placeholder="Select a city"
              value={form.customerCity}
              onChange={(e) => set("customerCity", e.target.value)}
              options={CITIES.map((c) => ({ value: c, label: c }))}
            />
            <Input
              label="Delivery address"
              required
              className="sm:col-span-2"
              placeholder="House, street, area"
              value={form.customerAddress}
              onChange={(e) => set("customerAddress", e.target.value)}
            />
            <Textarea
              label="Order note (optional)"
              className="sm:col-span-2"
              rows={3}
              placeholder="Any instructions for the seller…"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
            />
          </div>
        </form>

        {/* Order summary */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-800">Order summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {items.map((it) => (
              <li key={it.productId} className="flex justify-between gap-2 text-slate-600">
                <span className="min-w-0 truncate">
                  {it.name} × {it.quantity}
                </span>
                <span className="shrink-0">{formatPrice(it.price * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-3">
            <span className="font-medium text-slate-700">Total</span>
            <span className="text-lg font-bold text-brand-900">
              {formatPrice(groups.reduce((s, g) => s + groupTotal(g), 0))}
            </span>
          </div>
          {groups.length > 1 && (
            <p className="mt-2 text-xs text-slate-400">
              Items are from {groups.length} shops — one order is created per shop.
            </p>
          )}

          {/* Payment method */}
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700">Payment method</p>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-sm transition-colors has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50">
              <input
                type="radio"
                name="payment"
                checked={method === "cod"}
                onChange={() => setMethod("cod")}
              />
              <Banknote className="h-4 w-4 text-slate-500" />
              Cash on Delivery
            </label>
            {cardAvailable ? (
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-sm transition-colors has-[:checked]:border-indigo-400 has-[:checked]:bg-indigo-50">
                <input
                  type="radio"
                  name="payment"
                  checked={method === "card"}
                  onChange={() => setMethod("card")}
                />
                <CreditCard className="h-4 w-4 text-indigo-600" />
                Pay with card (Stripe)
              </label>
            ) : (
              groups.length > 1 && (
                <p className="text-xs text-slate-400">
                  Card payment is available when all items are from one shop.
                </p>
              )
            )}
          </div>

          <Button
            type="submit"
            form="checkout-form"
            fullWidth
            size="lg"
            variant="accent"
            className={method === "card" ? "mt-5 bg-indigo-600 hover:bg-indigo-700" : "mt-5"}
            loading={method === "card" ? cardLoading : isLoading}
            leftIcon={method === "card" ? <CreditCard className="h-4 w-4" /> : undefined}
          >
            {method === "card"
              ? `Pay ${formatPrice(groups.reduce((s, g) => s + groupTotal(g), 0))}`
              : "Place order"}
          </Button>
          <Link
            href="/cart"
            className="mt-3 block text-center text-sm font-medium text-brand-700 hover:underline"
          >
            Back to cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
