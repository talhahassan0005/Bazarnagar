import { configureStore, createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { apiSlice, setupAuthListeners } from "./apiSlice";
import authReducer from "./authSlice";
import uiReducer from "./uiSlice";
import cartReducer, {
  addItem,
  setQuantity,
  removeItem,
  clearStore,
  clearCart,
  hydrateCart,
  CART_STORAGE_KEY,
} from "./cartSlice";

// ── Cart persistence listener ────────────────────────────────────────────────
const cartListener = createListenerMiddleware();

cartListener.startListening({
  matcher: isAnyOf(addItem, setQuantity, removeItem, clearStore, clearCart, hydrateCart),
  effect: (_action, api) => {
    const state = api.getState() as RootState;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart.items));
    }
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
