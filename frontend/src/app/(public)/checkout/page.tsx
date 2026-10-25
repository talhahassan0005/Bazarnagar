"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Check,
  MessageCircle,
  ShoppingCart,
} from "lucide-react";
import { Button, EmptyState, Input, Textarea } from "@/components/ui";
import { CodNotice } from "@/components/domain/CodNotice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCart, selectCartItems } from "@/store/cartSlice";
import { addToast } from "@/store/uiSlice";
import {
  useCreateOrderMutation,
} from "@/store/apiSlice";
import { CitySelect } from "@/components/domain/CitySelect";
import { formatPrice, getErrorMessage, toWhatsAppNumber } from "@/lib/utils";
import { rememberOrder } from "@/lib/orderHistory";
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

const groupSubtotal = (g: StoreGroup) =>
  g.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

/** Sum of each distinct product's delivery fee once (not per unit) — mirrors the server. */
const groupDeliveryFee = (g: StoreGroup) =>
  g.items.reduce((sum, i) => sum + (i.deliveryOption === "available" ? (i.deliveryFee ?? 0) : 0), 0);

const groupTotal = (g: StoreGroup) => groupSubtotal(g) + groupDeliveryFee(g);

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const customer = useAppSelector((s) => s.auth.customer);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    customerCity: "",
    note: "",
  });
  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Prefill from the logged-in customer's account (once, doesn't overwrite edits).
  useEffect(() => {
    if (!customer) return;
    setForm((f) => ({
      ...f,
      customerName: f.customerName || customer.name,
      customerPhone: f.customerPhone || customer.phone,
      customerEmail: f.customerEmail || customer.email,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id]);

  const [placed, setPlaced] = useState<{ groups: StoreGroup[]; orders: Order[] } | null>(null);
  const groups = groupByStore(items);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const orders: Order[] = [];
      for (const g of groups) {
        const order = await createOrder({
          storeId: g.storeId,
          ...form,
          items: g.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }).unwrap();
        orders.push(order);
        rememberOrder(order.id);
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

        <CodNotice className="mt-6" />

        <div className="mt-8 space-y-4">
          {placed.orders.map((order, i) => {
            const g = placed.groups[i]!;
            const message = [
              `Hi ${g.storeName}, I placed an order on Bazarnagar.`,
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
        No account needed — just your delivery details. Pay by Cash on Delivery.
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
            <Input
              label="Email address"
              type="email"
              hint="Optional — we'll email your order confirmation and updates here."
              placeholder="you@example.com"
              className="sm:col-span-2"
              value={form.customerEmail}
              onChange={(e) => set("customerEmail", e.target.value)}
            />
            <CitySelect
              required
              value={form.customerCity}
              onChange={(city) => set("customerCity", city)}
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
          <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatPrice(groups.reduce((s, g) => s + groupSubtotal(g), 0))}</span>
            </div>
            {groups.reduce((s, g) => s + groupDeliveryFee(g), 0) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Delivery fee</span>
                <span>{formatPrice(groups.reduce((s, g) => s + groupDeliveryFee(g), 0))}</span>
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-100 pt-3">
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
            <div className="flex items-center gap-2.5 rounded-xl border border-brand-400 bg-brand-50 p-3 text-sm">
              <Banknote className="h-4 w-4 text-slate-500" />
              Cash on Delivery
            </div>
            <CodNotice />
          </div>

          <Button
            type="submit"
            form="checkout-form"
            fullWidth
            size="lg"
            variant="accent"
            className="mt-5"
            loading={isLoading}
          >
            Place order
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
