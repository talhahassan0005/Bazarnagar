import type { CartItem, Product, Store } from "./types";
import { effectivePrice } from "./utils";

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
  };
}
