import type { CartItem, Product, Store } from "./types";
import { effectivePrice } from "./utils";

/**
 * Can this product be ordered online (cart / buy now)? Not when the shop or
 * the product has no delivery — customers contact the seller on WhatsApp.
 */
export function canOrderOnline(product: Pick<Product, "deliveryOption">, store?: Pick<Store, "noDelivery"> | null): boolean {
  return !store?.noDelivery && product.deliveryOption !== "not_available";
}

/** Build a cart line from a product + its store (uses the effective price). */
export function buildCartItem(product: Product, store: Store, quantity = 1): CartItem {
  return {
    productId: product.id,
    name: product.name,
    price: effectivePrice(product),
    image: product.images[0],
    quantity,
    storeId: store.id,
    storeName: store.name,
    storeSlug: store.slug,
    whatsapp: store.whatsapp,
    deliveryOption: product.deliveryOption,
    deliveryFee: product.deliveryFee,
  };
}
