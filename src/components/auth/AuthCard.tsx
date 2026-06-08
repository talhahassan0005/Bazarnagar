import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";

/** Shared card chrome for login / signup forms. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: { text: string; linkText: string; href: string };
}) {
  return (
    <Card className="p-6 shadow-lg shadow-brand-900/5 sm:p-8">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-6">{children}</div>
      <p className="mt-6 text-center text-sm text-slate-500">
        {footer.text}{" "}
        <Link href={footer.href} className="font-medium text-brand-700 hover:underline">
          {footer.linkText}
        </Link>
      </p>
    </Card>
  );
}
