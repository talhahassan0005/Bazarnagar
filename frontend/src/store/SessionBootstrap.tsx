"use client";

import { useEffect } from "react";
import { useAppDispatch } from "./hooks";
import { authResolved, setAdminSession, setSellerSession } from "./authSlice";
import { hydrateCart, loadCart } from "./cartSlice";
import { clearToken, getToken } from "@/lib/api";
import { apiSlice } from "./apiSlice";

/**
 * On first load: restore the cart from localStorage, and restore the auth
 * session from a stored JWT so a page refresh keeps the user logged in.
 * Uses RTK Query's getMe endpoint instead of the raw api client.
 */
export function SessionBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(hydrateCart(loadCart()));

    if (!getToken()) {
      dispatch(authResolved());
      return;
    }

    let cancelled = false;
    dispatch(apiSlice.endpoints.getMe.initiate())
      .then((result) => {
        if (cancelled) return;
        if ("data" in result && result.data) {
          const me = result.data;
          if (me.role === "seller") dispatch(setSellerSession(me.seller));
          else dispatch(setAdminSession({ name: me.admin.name }));
        } else {
          clearToken();
          dispatch(authResolved());
        }
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        dispatch(authResolved());
      });

    return () => { cancelled = true; };
  }, [dispatch]);

  return null;
}
