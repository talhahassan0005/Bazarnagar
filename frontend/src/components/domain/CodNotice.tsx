import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Buyer safety notice: orders are Cash on Delivery only, so never pay a
 * seller in advance. `compact` is a one-liner for product pages.
 */
export function CodNotice({ compact, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <p className={cn("flex items-start gap-2 text-xs text-amber-800", className)}>
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          <strong>Cash on Delivery only.</strong> Pay when your order arrives — never send money in
          advance.
        </span>
      </p>
    );
  }

  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900",
        className
      )}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div>
        <p className="font-semibold">We only accept Cash on Delivery</p>
        <p className="mt-0.5 text-amber-800">
          Pay in cash only when your order is delivered. Don&apos;t pay anything upfront — not by
          bank transfer, JazzCash, Easypaisa or any other way — even if a seller asks.
        </p>
      </div>
    </div>
  );
}
