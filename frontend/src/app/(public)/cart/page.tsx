"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeItem,
  selectCartItems,
  selectCartTotal,
  setQuantity,
} from "@/store/cartSlice";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

export default function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);

  // Group items by store so multi-shop carts read clearly.
  const groups = items.reduce<Record<string, { name: string; items: CartItem[] }>>(
    (acc, item) => {
      (acc[item.storeId] ??= { name: item.storeName, items: [] }).items.push(item);
      return acc;
    },
    {}
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" />}
          title="Your cart is empty"
          description="Browse products and add items to get started."
          action={<Button href="/search">Browse products</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-brand-900">Your cart</h1>

      <div className="mt-6 space-y-6">
        {Object.entries(groups).map(([storeId, group]) => (
          <div key={storeId} className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              {group.name}
            </div>
            <ul className="divide-y divide-slate-100">
              {group.items.map((item) => (
                <li key={item.productId} className="flex flex-wrap items-center gap-3 p-4">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="text-sm text-slate-500">{formatPrice(item.price)}</p>
                  </div>

                  {/* Controls — own row on mobile, inline on sm+ */}
                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                    {/* Quantity stepper */}
                    <div className="flex items-center rounded-lg border border-slate-200">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          dispatch(
                            setQuantity({ productId: item.productId, quantity: item.quantity - 1 })
                          )
                        }
                        className="p-2 text-slate-500 hover:bg-slate-50"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() =>
                          dispatch(
                            setQuantity({ productId: item.productId, quantity: item.quantity + 1 })
                          )
                        }
                        className="p-2 text-slate-500 hover:bg-slate-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="w-20 text-right text-sm font-semibold text-slate-900">
                      {formatPrice(item.price * item.quantity)}
                    </div>

                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => dispatch(removeItem(item.productId))}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-brand-900">{formatPrice(total)}</p>
        </div>
        <Button href="/checkout" size="lg" variant="accent">
          Proceed to checkout
        </Button>
      </div>

      <div className="mt-4 text-center">
        <Link href="/search" className="text-sm font-medium text-brand-700 hover:underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
