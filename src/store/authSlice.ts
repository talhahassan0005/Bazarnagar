import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { CURRENT_SELLER_ID } from "@/lib/mockData";

export type Role = "guest" | "seller" | "admin";

interface AuthState {
  /** Logged-in seller id (drives all "my …" queries). */
  sellerId: string | null;
  role: Role;
}

// Prototype: a seller is "logged in" by default so the dashboard has data.
const initialState: AuthState = {
  sellerId: CURRENT_SELLER_ID,
  role: "seller",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSeller(state, action: PayloadAction<string>) {
      state.sellerId = action.payload;
      state.role = "seller";
    },
    loginAdmin(state) {
      state.role = "admin";
    },
    logout(state) {
      state.sellerId = null;
      state.role = "guest";
    },
  },
});

export const { loginSeller, loginAdmin, logout } = authSlice.actions;
export default authSlice.reducer;
