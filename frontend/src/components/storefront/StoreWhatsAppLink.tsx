"use client";

import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { useTrackStoreWhatsappClickMutation } from "@/store/apiSlice";
import { toWhatsAppNumber } from "@/lib/utils";

/** Green WhatsApp button for a shop, counting the tap like StoreWhatsAppLink. */
export function StoreWhatsAppButton({
  store,
  size,
  children,
}: {
  store: { id: string; whatsapp: string };
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const [trackClick] = useTrackStoreWhatsappClickMutation();
  return (
    <Button
      href={`https://wa.me/${toWhatsAppNumber(store.whatsapp)}`}
      target="_blank"
      rel="noopener noreferrer"
      variant="whatsapp"
      size={size}
      leftIcon={<MessageCircle className="h-4 w-4" />}
      onClick={() => {
        trackClick(store.id).catch(() => {});
      }}
    >
      {children}
    </Button>
  );
}

/**
 * Link to a shop's WhatsApp that counts the tap towards the shop's WhatsApp
 * clicks (shown to the seller and admins). Product-specific buttons use
 * WhatsAppButton, which counts per product instead.
 */
export function StoreWhatsAppLink({
  store,
  className,
  children,
}: {
  store: { id: string; whatsapp: string };
  className?: string;
  children: ReactNode;
}) {
  const [trackClick] = useTrackStoreWhatsappClickMutation();
  return (
    <a
      href={`https://wa.me/${toWhatsAppNumber(store.whatsapp)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        // Fire-and-forget: never block opening WhatsApp on the count.
        trackClick(store.id).catch(() => {});
      }}
    >
      {children}
    </a>
  );
}
