"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { SidebarNav, type NavItem } from "./SidebarNav";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/authSlice";

/**
 * Generic dashboard layout with a collapsible sidebar.
 * Reused by both the seller dashboard and the admin panel — only the nav
 * items, brand link, and user chip differ.
 */
export function DashboardShell({
  navItems,
  user,
  homeHref,
  badge,
  children,
}: {
  navItems: NavItem[];
  user: { name: string; subtitle: string; avatarUrl?: string };
  homeHref: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.push(homeHref.startsWith("/admin") ? "/admin/login" : "/login");
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <Logo href={homeHref} />
        {badge}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <SidebarNav items={navItems} />
      </div>
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={user.name} src={user.avatarUrl} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.subtitle}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-accent-600"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-slate-900/40 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />
        <aside
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-y-0 left-0 w-64 bg-white shadow-xl transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebar}
        </aside>
      </div>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Logo href={homeHref} />
        </header>
        <main
          key={pathname}
          className="mx-auto w-full max-w-[1600px] animate-fade-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/** Standard page heading used inside the dashboard. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export { Link };
