"use client";

import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { DashboardShell } from "./DashboardShell";
import type { NavItem } from "./SidebarNav";
import { Badge } from "@/components/ui";

const NAV: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Sellers", href: "/admin/sellers", icon: Users },
  { label: "Stores", href: "/admin/stores", icon: Store },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Moderation", href: "/admin/moderation", icon: ShieldCheck },
  { label: "Plans & Billing", href: "/admin/plans", icon: CreditCard },
];

/** Admin panel chrome (sidebar + header). */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      navItems={NAV}
      homeHref="/admin"
      user={{ name: "Admin", subtitle: "Platform administrator" }}
      badge={
        <Badge tone="red" className="ml-1">
          Admin
        </Badge>
      }
    >
      {children}
    </DashboardShell>
  );
}
