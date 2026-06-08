"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** When true, only the exact path is active (used for dashboard roots). */
  exact?: boolean;
}

/** Vertical nav list shared by the seller and admin shells. */
export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map(({ label, href, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent-500" />
            )}
            <Icon
              className={cn(
                "h-5 w-5 transition-colors",
                active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
              )}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
