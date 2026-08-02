import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Customer, Seller } from "@/lib/types";

export type Role = "guest" | "seller" | "admin" | "customer";

interface AuthState {
  /** Logged-in seller id (drives all "my …" queries). */
  sellerId: string | null;
  role: Role;
  /** Cached seller profile for the dashboard chrome. */
  seller: Seller | null;
  adminName: string | null;
  /** Logged-in customer (buyer) profile, if any. */
  customer: Customer | null;
  /** True once session restore (SessionBootstrap) has finished. */
  ready: boolean;
}

const initialState: AuthState = {
  sellerId: null,
  role: "guest",
  seller: null,
  adminName: null,
  customer: null,
  ready: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSellerSession(state, action: PayloadAction<Seller>) {
      state.seller = action.payload;
      state.sellerId = action.payload.id;
      state.role = "seller";
      state.adminName = null;
      state.customer = null;
      state.ready = true;
    },
    setAdminSession(state, action: PayloadAction<{ name: string }>) {
      state.role = "admin";
      state.adminName = action.payload.name;
      state.sellerId = null;
      state.seller = null;
      state.customer = null;
      state.ready = true;
    },
    setCustomerSession(state, action: PayloadAction<Customer>) {
      state.role = "customer";
      state.customer = action.payload;
      state.sellerId = null;
      state.seller = null;
      state.adminName = null;
      state.ready = true;
    },
    /** Session restore finished with no logged-in user. */
    authResolved(state) {
      state.ready = true;
    },
    logout(state) {
      state.sellerId = null;
      state.role = "guest";
      state.seller = null;
      state.adminName = null;
      state.customer = null;
      state.ready = true;
    },
  },
});

export const { setSellerSession, setAdminSession, setCustomerSession, authResolved, logout } =
  authSlice.actions;
export default authSlice.reducer;
