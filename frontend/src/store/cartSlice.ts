import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartItem } from "@/lib/types";
import type { RootState } from "./index";

const STORAGE_KEY = "bn_cart";

interface CartState {
  items: CartItem[];
}

const initialState: CartState = { items: [] };

/** Persist the cart to localStorage (client only). */
function persist(items: CartItem[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

/** Read the persisted cart (client only). */
export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
    },
    addItem(state, action: PayloadAction<CartItem>) {
      const incoming = action.payload;
      const existing = state.items.find((i) => i.productId === incoming.productId);
      if (existing) existing.quantity += incoming.quantity;
      else state.items.push(incoming);
      persist(state.items);
    },
    setQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const item = state.items.find((i) => i.productId === action.payload.productId);
      if (item) item.quantity = Math.max(1, action.payload.quantity);
      persist(state.items);
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.productId !== action.payload);
      persist(state.items);
    },
    clearStore(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.storeId !== action.payload);
      persist(state.items);
    },
    clearCart(state) {
      state.items = [];
      persist(state.items);
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
