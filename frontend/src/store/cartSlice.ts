import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartItem } from "@/lib/types";
import type { RootState } from "./index";

/**
 * Each cart is stored per owner, so carts never leak between people sharing a
 * browser: "guest" for logged-out visitors, "customer:<id>" for each buyer.
 */
export const GUEST_CART_OWNER = "guest";
export const cartStorageKey = (owner: string) => `bn_cart:${owner}`;
/** Pre-per-user cart key; migrated into the first owner seen, then removed. */
export const LEGACY_CART_KEY = "bn_cart";

interface CartState {
  items: CartItem[];
  /** Whose cart is loaded; null until the session has been resolved. */
  owner: string | null;
}

const initialState: CartState = { items: [], owner: null };

/** Read a persisted cart (client only). */
export function readCart(key: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

/** Combine two carts, adding quantities for products in both. */
export function mergeCarts(base: CartItem[], extra: CartItem[]): CartItem[] {
  const merged = base.map((i) => ({ ...i }));
  for (const item of extra) {
    const existing = merged.find((i) => i.productId === item.productId);
    if (existing) existing.quantity += item.quantity;
    else merged.push({ ...item });
  }
  return merged;
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart(state, action: PayloadAction<{ owner: string; items: CartItem[] }>) {
      state.owner = action.payload.owner;
      state.items = action.payload.items;
    },
    addItem(state, action: PayloadAction<CartItem>) {
      const incoming = action.payload;
      const existing = state.items.find((i) => i.productId === incoming.productId);
      if (existing) existing.quantity += incoming.quantity;
      else state.items.push(incoming);
    },
    setQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const item = state.items.find((i) => i.productId === action.payload.productId);
      if (item) item.quantity = Math.max(1, action.payload.quantity);
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.productId !== action.payload);
    },
    clearStore(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.storeId !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { hydrateCart, addItem, setQuantity, removeItem, clearStore, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;

/* -------------------------------- Selectors ------------------------------- */

export const selectCartItems = (s: RootState) => s.cart.items;
export const selectCartCount = (s: RootState) =>
  s.cart.items.reduce((n, i) => n + i.quantity, 0);
export const selectCartTotal = (s: RootState) =>
  s.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
