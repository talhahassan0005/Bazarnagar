import type { Request, Response } from "express";
import { z } from "zod";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { Store } from "../models/Store";
import { Seller } from "../models/Seller";
import { ApiError, asyncHandler } from "../lib/helpers";

/** The price actually charged (discount if present and lower). */
function effectivePrice(price: number, discountPrice?: number): number {
  return discountPrice != null && discountPrice < price ? discountPrice : price;
}

const createOrderSchema = z.object({
  storeId: z.string().min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().min(6),
  customerAddress: z.string().min(3),
  customerCity: z.string().min(1),
  note: z.string().optional(),
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive() }))
    .min(1),
});

/**
 * POST /api/public/orders — place a guest order (no login).
 * Prices/names are resolved server-side from the catalog; the client total is
 * never trusted. One order is scoped to a single store.
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const data = createOrderSchema.parse(req.body);

  const store = await Store.findOne({ _id: data.storeId, status: "active" });
  if (!store) throw new ApiError(404, "Store not found");

  const items = [];
  let total = 0;
  for (const line of data.items) {
    const product = await Product.findOne({
      _id: line.productId,
      storeId: store._id,
      status: "active",
      moderationStatus: "approved",
    });
    if (!product) throw new ApiError(400, "One or more products are no longer available");
    const price = effectivePrice(product.price, product.discountPrice);
    items.push({
      productId: product._id,
      name: product.name,
      price,
      quantity: line.quantity,
      image: product.images[0],
    });
    total += price * line.quantity;
  }

  const order = await Order.create({
    storeId: store._id,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerAddress: data.customerAddress,
    customerCity: data.customerCity,
    note: data.note,
    items,
    total,
  });

  res.status(201).json(order.toJSON());
});

/** Resolve the authenticated seller's store or throw. */
async function sellerStoreId(req: Request) {
  const seller = await Seller.findById(req.user!.id);
  if (!seller?.storeId) throw new ApiError(400, "Create your store profile first");
  return seller.storeId;
}

/** GET /api/seller/orders — orders for the seller's store. */
export const getSellerOrders = asyncHandler(async (req: Request, res: Response) => {
  const storeId = await sellerStoreId(req);
  const orders = await Order.find({ storeId }).sort({ createdAt: -1 });
  res.json(orders.map((o) => o.toJSON()));
});

const statusSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
});

/** PATCH /api/seller/orders/:id/status — update an order's status (ownership checked). */
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const storeId = await sellerStoreId(req);
  const { status } = statusSchema.parse(req.body);
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, storeId },
    { status },
    { new: true }
  );
  if (!order) throw new ApiError(404, "Order not found");
  res.json(order.toJSON());
});
