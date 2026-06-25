"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { api } from "@/lib/api";
import { buildWhatsAppLink } from "@/lib/utils";
import type { Product, Store } from "@/lib/types";

/**
 * WhatsApp inquiry button (SRS §8). Opens WhatsApp with a pre-filled message,
 * using the negotiable template when the product allows it.
 */
export function WhatsAppButton({
  product,
  store,
  size = "md",
  fullWidth,
  label = "Inquire on WhatsApp",
}: {
  product: Pick<Product, "name" | "price" | "negotiable" | "id">;
  store: Pick<Store, "whatsapp" | "slug">;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  label?: string;
}) {
  const productLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/store/${store.slug}/product/${product.id}`
      : `/store/${store.slug}/product/${product.id}`;

  const href = buildWhatsAppLink({
    phone: store.whatsapp,
    productName: product.name,
    price: product.price,
    negotiable: product.negotiable,
    productLink,
  });

  return (
    <Button
      variant="whatsapp"
      size={size}
      fullWidth={fullWidth}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      leftIcon={<MessageCircle className="h-4 w-4" />}
      onClick={() => {
        // Fire-and-forget impression tracking (WhatsApp inquiry clicks).
        void api.trackWhatsappClick(product.id).catch(() => {});
      }}
    >
      {label}
    </Button>
  );
}
