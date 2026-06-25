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
} from "lucide-react";
import { DashboardShell } from "./DashboardShell";
import type { NavItem } from "./SidebarNav";
import { Badge, LoadingPanel } from "@/components/ui";
import { useAppSelector } from "@/store/hooks";

const NAV: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Sellers", href: "/admin/sellers", icon: Users },
  { label: "Stores", href: "/admin/stores", icon: Store },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Moderation", href: "/admin/moderation", icon: ShieldCheck },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Plans & Billing", href: "/admin/plans", icon: CreditCard },
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
