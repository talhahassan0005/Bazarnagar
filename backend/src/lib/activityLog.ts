import { ActivityLog } from "../models/ActivityLog";
import type { SellerDoc } from "../models/Seller";
import type { StoreDoc } from "../models/Store";
import type { ProductDoc } from "../models/Product";

/**
 * Record a store creation / product addition. Logging must never block or
 * fail the seller's request, so errors are only reported to the console.
 */
async function record(entry: Parameters<typeof ActivityLog.create>[0]): Promise<void> {
  try {
    await ActivityLog.create(entry);
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }
}

export function logStoreCreated(seller: SellerDoc, store: StoreDoc): Promise<void> {
  return record({
    type: "store.created",
    sellerId: seller._id,
    storeId: store._id,
    snapshot: {
      sellerName: seller.name,
      sellerEmail: seller.email,
      storeName: store.name,
      storeSlug: store.slug,
      city: store.city,
      category: store.category,
    },
  });
}

export function logProductCreated(
  seller: SellerDoc,
  store: StoreDoc,
  product: ProductDoc
): Promise<void> {
  return record({
    type: "product.created",
    sellerId: seller._id,
    storeId: store._id,
    productId: product._id,
    snapshot: {
      sellerName: seller.name,
      sellerEmail: seller.email,
      storeName: store.name,
      storeSlug: store.slug,
      city: store.city,
      category: product.category,
      productName: product.name,
      price: product.price,
    },
  });
}
