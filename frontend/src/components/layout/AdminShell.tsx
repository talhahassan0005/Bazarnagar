"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShieldCheck,
  Star,
  CreditCard,
  Settings,
  Megaphone,
  Landmark,
  History,
  BarChart3,
} from "lucide-react";
import { DashboardShell } from "./DashboardShell";
import type { NavItem } from "./SidebarNav";
import { Badge, LoadingPanel } from "@/components/ui";
import { useAppSelector } from "@/store/hooks";

const NAV: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },

  { group: "Marketplace", label: "Sellers", href: "/admin/sellers", icon: Users },
  { group: "Marketplace", label: "Stores", href: "/admin/stores", icon: Store },
  { group: "Marketplace", label: "Products", href: "/admin/products", icon: Package },

  { group: "Moderation", label: "Product Review", href: "/admin/moderation", icon: ShieldCheck },
  { group: "Moderation", label: "Customer Reviews", href: "/admin/reviews", icon: Star },

  { group: "Insights", label: "Activity Log", href: "/admin/activity", icon: History },
  { group: "Insights", label: "Data Summary", href: "/admin/data", icon: BarChart3 },

  { group: "Billing", label: "Plans & Billing", href: "/admin/plans", icon: CreditCard },
  { group: "Billing", label: "Payment Requests", href: "/admin/payment-requests", icon: Landmark },
  { group: "Billing", label: "Plan Settings", href: "/admin/plan-settings", icon: Settings },

  { group: "Advertising", label: "Banner Ads", href: "/admin/banners", icon: Megaphone },
];

/** Admin panel chrome (sidebar + header) with an auth guard. */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const role = useAppSelector((s) => s.auth.role);
  const ready = useAppSelector((s) => s.auth.ready);

  useEffect(() => {
    if (ready && role !== "admin") router.replace("/admin/login");
  }, [ready, role, router]);

  if (!ready || role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingPanel label="Loading…" />
      </div>
    );
  }

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
