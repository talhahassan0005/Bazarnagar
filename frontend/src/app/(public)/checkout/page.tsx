"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Check,
  CreditCard,
  Lock,
  MessageCircle,
  ShoppingCart,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Button, EmptyState, Input, Select, Textarea } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCart, selectCartItems } from "@/store/cartSlice";
import { addToast } from "@/store/uiSlice";
import {
  useCreateOrderMutation,
  useGetPaymentConfigQuery,
  useSafepayCheckoutMutation,
  useSafepayMockConfirmMutation,
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
  const [createSafepay, { isLoading: onlineLoading }] = useSafepayCheckoutMutation();
  const [confirmSafepay] = useSafepayMockConfirmMutation();
  // hosted = live Safepay (redirect to their secure page); else local mock mode
  // where we collect test details inline.
  const { data: payConfig } = useGetPaymentConfigQuery();
  const hosted = Boolean(payConfig?.hosted);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerCity: "",
    note: "",
  });
  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Inline payment-detail fields (test/demo — in production these come from
  // Safepay's secure embedded form, never stored by us).
  const [pay, setPay] = useState({ account: "", cardNumber: "", expiry: "", cvv: "" });
  const [payErrors, setPayErrors] = useState<Partial<Record<keyof typeof pay, string>>>({});
  const setPayField = (key: keyof typeof pay, value: string) => {
    setPay((p) => ({ ...p, [key]: value }));
    setPayErrors((e) => ({ ...e, [key]: "" })); // clear the error as they type
  };

  /** Validate the payment fields for the selected online method. */
  function validatePay(): Partial<Record<keyof typeof pay, string>> {
    const e: Partial<Record<keyof typeof pay, string>> = {};
    if (method === "card") {
      const num = pay.cardNumber.replace(/\s+/g, "");
      if (!/^\d{16}$/.test(num)) e.cardNumber = "Enter a valid 16-digit card number.";

      const exp = pay.expiry.trim();
      if (!/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(exp)) {
        e.expiry = "Use MM/YY format.";
      } else {
        const [mm, yy] = exp.split("/").map((s) => parseInt(s.trim(), 10));
        // Card is valid through the end of its expiry month.
        const expDate = new Date(2000 + yy!, mm!, 0, 23, 59, 59);
        if (expDate < new Date()) e.expiry = "This card has expired.";
      }

      if (!/^\d{3,4}$/.test(pay.cvv.trim())) e.cvv = "CVV must be 3 or 4 digits.";
    } else if (method === "easypaisa" || method === "jazzcash") {
      const digits = pay.account.replace(/\D/g, "");
      if (!/^03\d{9}$/.test(digits)) {
        e.account = "Enter a valid 11-digit mobile number (03XX-XXXXXXX).";
      }
    }
    return e;
  }

  const [placed, setPlaced] = useState<{ groups: StoreGroup[]; orders: Order[] } | null>(null);
  // easypaisa / jazzcash / card all go through Safepay (one online gateway).
  const [method, setMethod] = useState<"cod" | "easypaisa" | "jazzcash" | "card">("cod");

  const groups = groupByStore(items);
  const singleStore = groups.length === 1 ? groups[0]! : null;

  // Online (EasyPaisa/JazzCash/card via Safepay) works for any single-shop cart.
  const onlineAvailable = Boolean(singleStore);
  // The Safepay online methods (specific method is passed to the gateway).
  const isSafepay = method === "easypaisa" || method === "jazzcash" || method === "card";

  useEffect(() => {
    if (!onlineAvailable && isSafepay) setMethod("cod");
  }, [onlineAvailable, isSafepay]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // EasyPaisa / JazzCash / card (Safepay) → create the order and redirect to
    // the secure gateway (or the local test gateway in mock mode). The chosen
    // method is passed along so the gateway shows the right fields.
    if (isSafepay && singleStore) {
      // In hosted (live) mode the details are entered on Safepay's page, so we
      // only validate the inline test fields in mock mode.
      if (!hosted) {
        const errs = validatePay();
        if (Object.keys(errs).length > 0) {
          setPayErrors(errs);
          return;
        }
      }
      try {
        const { url, orderId, mock } = await createSafepay({
          storeId: singleStore.storeId,
          ...form,
          items: singleStore.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }).unwrap();
        if (mock) {
          // Mock/test mode: details were entered inline above, so confirm the
          // payment directly and go to the success page.
          await confirmSafepay(orderId).unwrap();
          dispatch(clearCart());
          window.location.href = `/checkout/success?order=${orderId}`;
        } else {
          // Live mode: hand off to Safepay's secure hosted checkout. The order
          // is already created, so clear the cart now — this also avoids the
          // cart re-hydrating from localStorage when we return to the site.
          dispatch(clearCart());
          window.location.href = url;
        }
      } catch (err) {
        dispatch(addToast(getErrorMessage(err, "Could not start online payment"), "error"));
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
        No account needed — just your delivery details. Pay by Cash on Delivery,
        EasyPaisa, JazzCash or card.
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
            {/* Live (hosted) mode: Safepay's page presents the enabled methods
                (card / EasyPaisa / JazzCash / wallets), so we show ONE option. */}
            {onlineAvailable && hosted && (
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-sm transition-colors has-[:checked]:border-leaf-400 has-[:checked]:bg-leaf-50">
                <input
                  type="radio"
                  name="payment"
                  className="mt-0.5"
                  checked={isSafepay}
                  onChange={() => setMethod("card")}
                />
                <Wallet className="mt-0.5 h-4 w-4 text-leaf-600" />
                <span>
                  Pay online — Card / EasyPaisa / JazzCash
                  <span className="mt-0.5 block text-xs text-slate-400">
                    Choose your method securely on the Safepay page.
                  </span>
                </span>
              </label>
            )}

            {/* Mock/demo mode: three inline methods for local testing. */}
            {onlineAvailable && !hosted &&
              (
                [
                  { id: "easypaisa", label: "EasyPaisa", hint: "Mobile account / OTP" },
                  { id: "jazzcash", label: "JazzCash", hint: "Mobile account / OTP" },
                  { id: "card", label: "Debit / Credit Card", hint: "Visa · Mastercard" },
                ] as const
              ).map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-sm transition-colors has-[:checked]:border-leaf-400 has-[:checked]:bg-leaf-50"
                >
                  <input
                    type="radio"
                    name="payment"
                    className="mt-0.5"
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                  />
                  {m.id === "card" ? (
                    <CreditCard className="mt-0.5 h-4 w-4 text-leaf-600" />
                  ) : (
                    <Smartphone className="mt-0.5 h-4 w-4 text-leaf-600" />
                  )}
                  <span>
                    {m.label}
                    <span className="mt-0.5 block text-xs text-slate-400">{m.hint}</span>
                  </span>
                </label>
              ))}
            {/* Live mode: details are entered on Safepay's secure page. */}
            {isSafepay && hosted && (
              <p className="flex items-center gap-1.5 rounded-xl border border-leaf-200 bg-leaf-50/50 p-3 text-xs text-slate-500">
                <Lock className="h-3 w-3" /> You'll be securely redirected to Safepay to complete
                your payment.
              </p>
            )}

            {/* Mock mode: inline test payment details for the selected method. */}
            {isSafepay && !hosted && (
              <div className="space-y-3 rounded-xl border border-leaf-200 bg-leaf-50/50 p-3">
                {method === "card" ? (
                  <>
                    <Input
                      label="Card number"
                      inputMode="numeric"
                      maxLength={19}
                      placeholder="4242 4242 4242 4242"
                      value={pay.cardNumber}
                      error={payErrors.cardNumber}
                      onChange={(e) => setPayField("cardNumber", e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Expiry"
                        placeholder="MM / YY"
                        maxLength={7}
                        value={pay.expiry}
                        error={payErrors.expiry}
                        onChange={(e) => setPayField("expiry", e.target.value)}
                      />
                      <Input
                        label="CVV"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="123"
                        value={pay.cvv}
                        error={payErrors.cvv}
                        onChange={(e) => setPayField("cvv", e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <Input
                    label={`${method === "easypaisa" ? "EasyPaisa" : "JazzCash"} mobile number`}
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="03XX-XXXXXXX"
                    hint="An OTP will be sent to approve the payment."
                    value={pay.account}
                    error={payErrors.account}
                    onChange={(e) => setPayField("account", e.target.value)}
                  />
                )}
                <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Lock className="h-3 w-3" /> Secured by Safepay · test mode — no real charge.
                </p>
              </div>
            )}
            {!onlineAvailable && groups.length > 1 && (
              <p className="text-xs text-slate-400">
                Online payment is available when all items are from one shop.
              </p>
            )}
          </div>

          <Button
            type="submit"
            form="checkout-form"
            fullWidth
            size="lg"
            variant="accent"
            className={isSafepay ? "mt-5 bg-leaf-600 hover:bg-leaf-700" : "mt-5"}
            loading={isSafepay ? onlineLoading : isLoading}
            leftIcon={
              method === "cod" ? undefined : method === "easypaisa" || method === "jazzcash" ? (
                <Wallet className="h-4 w-4" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )
            }
          >
            {method === "cod"
              ? "Place order"
              : `Pay ${formatPrice(groups.reduce((s, g) => s + groupTotal(g), 0))}`}
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
