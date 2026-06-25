"use client";

import { useEffect } from "react";
import { useAppDispatch } from "./hooks";
import { authResolved, setAdminSession, setSellerSession } from "./authSlice";
import { hydrateCart, loadCart } from "./cartSlice";
import { api, clearToken, getToken } from "@/lib/api";

/**
 * On first load: restore the cart from localStorage, and restore the auth
 * session from a stored JWT so a page refresh keeps the user logged in.
 * Runs after mount to avoid SSR hydration mismatches. Renders nothing.
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
    api
      .getMe()
      .then((me) => {
        if (cancelled) return;
        if (me.role === "seller") dispatch(setSellerSession(me.seller));
        else dispatch(setAdminSession({ name: me.admin.name }));
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        dispatch(authResolved());
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return null;
}
