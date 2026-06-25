"use client";

import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "./index";
import { SessionBootstrap } from "./SessionBootstrap";
import { Toaster } from "@/components/ui/Toaster";

/** Wraps the app in the Redux store and mounts the global toaster. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <SessionBootstrap />
      {children}
      <Toaster />
    </Provider>
  );
}
