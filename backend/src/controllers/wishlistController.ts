import type { Request, Response } from "express";
import { z } from "zod";
import { WishlistItem } from "../models/Wishlist";
import { Product } from "../models/Product";
import { Store } from "../models/Store";
import { ApiError, asyncHandler } from "../lib/helpers";

/** GET /api/customer/wishlist — the logged-in customer's saved products. */
export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const items = await WishlistItem.find({ customerId: req.user!.id }).sort({ createdAt: -1 });

  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const storeIds = [...new Set(products.map((p) => p.storeId.toString()))];
  const stores = await Store.find({ _id: { $in: storeIds } });
  const storeById = new Map(stores.map((s) => [s.id, s.toJSON()]));
  const productById = new Map(products.map((p) => [p.id, p]));

  const result = items
    .map((i) => productById.get(i.productId.toString()))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({ ...p.toJSON(), store: storeById.get(p.storeId.toString()) ?? null }));

  res.json(result);
});

const wishlistBodySchema = z.object({ productId: z.string().min(1) });

/** POST /api/customer/wishlist — save a product (idempotent). */
export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = wishlistBodySchema.parse(req.body);
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  await WishlistItem.updateOne(
    { customerId: req.user!.id, productId },
    { $setOnInsert: { customerId: req.user!.id, productId } },
    { upsert: true }
  );
  res.status(201).json({ ok: true });
});

/** DELETE /api/customer/wishlist/:productId — remove a saved product. */
export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  await WishlistItem.deleteOne({ customerId: req.user!.id, productId: req.params.productId });
  res.json({ ok: true });
});
