"use client";

import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

/**
 * "Facing a problem? Contact us" for payment screens. Opens the contact page
 * in payment-help mode, carrying the seller's account email when logged in
 * (otherwise the contact page asks which email they're signing up with).
 */
export function PaymentHelpLink({ className }: { className?: string }) {
  const email = useAppSelector((s) => s.auth.seller?.email);
  const href = `/contact?topic=payment${email ? `&email=${encodeURIComponent(email)}` : ""}`;
  return (
    <p className={cn("flex flex-wrap items-center justify-center gap-1.5 text-sm text-slate-500", className)}>
      <LifeBuoy className="h-4 w-4 text-accent-500" />
      Facing a problem with payment?
      <Link href={href} className="font-semibold text-brand-700 hover:underline">
        Contact us
      </Link>
    </p>
  );
}
