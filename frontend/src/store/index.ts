import { configureStore, createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { apiSlice, setupAuthListeners } from "./apiSlice";
import uiReducer from "./uiSlice";
import authReducer, {
  authResolved,
  logout,
  setAdminSession,
  setCustomerSession,
  setSellerSession,
} from "./authSlice";
import cartReducer, {
  addItem,
  setQuantity,
  removeItem,
  clearStore,
  clearCart,
  hydrateCart,
  readCart,
  mergeCarts,
  cartStorageKey,
  GUEST_CART_OWNER,
  dropLegacyCartOnce,
} from "./cartSlice";

// ── Cart persistence listener ────────────────────────────────────────────────
const cartListener = createListenerMiddleware();

// Save the cart under its owner's key whenever it changes.
cartListener.startListening({
  matcher: isAnyOf(addItem, setQuantity, removeItem, clearStore, clearCart, hydrateCart),
  effect: (_action, api) => {
    const { cart } = api.getState() as RootState;
    if (typeof window !== "undefined" && cart.owner) {
      window.localStorage.setItem(cartStorageKey(cart.owner), JSON.stringify(cart.items));
    }
  },
});

// Swap in the right cart whenever who's logged in changes (first load, login,
// logout). A guest's cart is carried into the buyer's cart when they log in.
cartListener.startListening({
  matcher: isAnyOf(setCustomerSession, setSellerSession, setAdminSession, authResolved, logout),
  effect: (_action, api) => {
    if (typeof window === "undefined") return;
    const { auth, cart } = api.getState() as RootState;
    const owner =
      auth.role === "customer" && auth.customer ? `customer:${auth.customer.id}` : GUEST_CART_OWNER;
    if (owner === cart.owner) return;

    dropLegacyCartOnce();
    let items = readCart(cartStorageKey(owner));

    if (owner !== GUEST_CART_OWNER) {
      items = mergeCarts(items, readCart(cartStorageKey(GUEST_CART_OWNER)));
      window.localStorage.removeItem(cartStorageKey(GUEST_CART_OWNER));
    }

    api.dispatch(hydrateCart({ owner, items }));
  },
});

// ── Auth listeners (C: sync authSlice from RTK Query) ────────────────────────
const authListener = createListenerMiddleware();
setupAuthListeners(authListener.startListening.bind(authListener));

// ── Store ────────────────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    ui: uiReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(cartListener.middleware, authListener.middleware)
      .concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
