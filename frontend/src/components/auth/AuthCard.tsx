import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Shared card chrome for login / signup forms. */
export function AuthCard({
  title,
  subtitle,
  icon,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  children: ReactNode;
  footer: { text: string; linkText: string; href: string };
}) {
  return (
    <Card className={cn("rounded-3xl border-slate-200/60 p-7 shadow-2xl shadow-black/30 sm:p-9")}>
      {icon && (
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-900/25 ring-4 ring-brand-500/10">
          {icon}
        </div>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{subtitle}</p>
      <div className="mt-7">{children}</div>
      <div className="mt-7 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
        {footer.text}{" "}
        <Link href={footer.href} className="font-semibold text-brand-700 hover:text-brand-800 hover:underline">
          {footer.linkText}
        </Link>
      </div>
    </Card>
  );
}
