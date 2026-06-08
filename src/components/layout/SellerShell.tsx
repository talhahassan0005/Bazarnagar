"use client";

import type { ReactNode } from "react";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Package,
  Store,
} from "lucide-react";
import { DashboardShell } from "./DashboardShell";
import type { NavItem } from "./SidebarNav";
import { Badge } from "@/components/ui";
import { PLANS } from "@/lib/constants";
import { CURRENT_SELLER_ID, SELLERS } from "@/lib/mockData";

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Store Profile", href: "/dashboard/store", icon: Store },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Plan & Billing", href: "/dashboard/plan", icon: CreditCard },
];

/** Seller dashboard chrome (sidebar + header). */
export function SellerShell({ children }: { children: ReactNode }) {
  const seller = SELLERS.find((s) => s.id === CURRENT_SELLER_ID)!;
  const plan = PLANS[seller.planId];

  return (
    <DashboardShell
      navItems={NAV}
      homeHref="/dashboard"
      user={{ name: seller.name, subtitle: seller.email }}
      badge={
        <Badge tone="brand" className="ml-1">
          {plan.name}
        </Badge>
      }
    >
      {children}
    </DashboardShell>
  );
}
