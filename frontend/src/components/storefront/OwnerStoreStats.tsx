import { Eye, Lock, MessageCircle, ShoppingCart, Zap } from "lucide-react";
import { formatCount } from "@/lib/utils";
import type { Store } from "@/lib/types";

/**
 * Shop stats strip for the shop's own seller (and admins) viewing the public
 * store page. The API only sends these counts to them, so it renders nothing
 * for shoppers.
 */
export function OwnerStoreStats({ store, className }: { store: Store; className?: string }) {
  if (store.views == null) return null;

  const stats = [
    { icon: Eye, label: "shop views", value: store.views },
    { icon: MessageCircle, label: "WhatsApp clicks", value: store.whatsappClicks },
    { icon: ShoppingCart, label: "add to cart", value: store.addToCartClicks },
    { icon: Zap, label: "buy now", value: store.buyNowClicks },
  ];

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-2.5 text-sm text-brand-800 ${className ?? ""}`}
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
        <Lock className="h-3.5 w-3.5" /> Only you can see this
      </span>
      {stats.map(({ icon: Icon, label, value }) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-brand-500" />
          <strong>{formatCount(value ?? 0)}</strong> {label}
        </span>
      ))}
    </div>
  );
}
