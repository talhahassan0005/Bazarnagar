"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import { DashboardShell } from "./DashboardShell";
import type { NavItem } from "./SidebarNav";
import { Badge, LoadingPanel } from "@/components/ui";
import { PLANS } from "@/lib/constants";
import { useAppSelector } from "@/store/hooks";

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Store Profile", href: "/dashboard/store", icon: Store },
  { label: "Landing Page", href: "/dashboard/landing", icon: Sparkles },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Plan & Billing", href: "/dashboard/plan", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

/** Seller dashboard chrome (sidebar + header) with an auth guard. */
export function SellerShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const role = useAppSelector((s) => s.auth.role);
  const ready = useAppSelector((s) => s.auth.ready);
  const seller = useAppSelector((s) => s.auth.seller);
  const plan = seller ? PLANS[seller.planId] : null;

  // Once the session is resolved, bounce non-sellers to login.
  useEffect(() => {
    if (ready && role !== "seller") router.replace("/login");
  }, [ready, role, router]);

  // Don't render the dashboard (or fire seller queries) until authenticated.
  if (!ready || role !== "seller") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingPanel label="Loading…" />
      </div>
    );
  }

  return (
    <DashboardShell
      navItems={NAV}
      homeHref="/dashboard"
      user={{ name: seller?.name ?? "Seller", subtitle: seller?.email ?? "" }}
      badge={
        plan && (
          <Badge tone="brand" className="ml-1">
            {plan.name}
          </Badge>
        )
      }
    >
      {children}
    </DashboardShell>
  );
}
