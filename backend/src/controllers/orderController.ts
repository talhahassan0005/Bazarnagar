import type { Request, Response } from "express";
import { z } from "zod";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { Store } from "../models/Store";
import { Seller } from "../models/Seller";
import { ApiError, asyncHandler } from "../lib/helpers";
import { computeDeliveryFee } from "../lib/delivery";

/** The price actually charged (discount if present and lower). */
function effectivePrice(price: number, discountPrice?: number): number {
  return discountPrice != null && discountPrice < price ? discountPrice : price;
}

const createOrderSchema = z.object({
  storeId: z.string().min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().min(6),
  customerEmail: z.string().email().optional().or(z.literal("")),
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
  const products = [];
  let subtotal = 0;
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
    products.push(product);
    subtotal += price * line.quantity;
  }
  const deliveryFee = computeDeliveryFee(products);

  const order = await Order.create({
    storeId: store._id,
    customerId: req.user?.role === "customer" ? req.user.id : undefined,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail || undefined,
    customerAddress: data.customerAddress,
    customerCity: data.customerCity,
    note: data.note,
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
  });

  res.status(201).json(order.toJSON());
});

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

/**
 * GET /api/public/orders/by-ids?ids=<comma-separated order ids> — a guest's
 * order history. Deliberately NOT looked up by phone/email (that would let
 * anyone browse a stranger's orders and delivery address just by knowing
 * their phone number). Instead the browser remembers its own order ids
 * locally after checkout and asks for exactly those — nobody else can see
 * them without already knowing the (unguessable) order id.
 */
export const getOrdersByIds = asyncHandler(async (req: Request, res: Response) => {
  const raw = (req.query.ids as string | undefined) ?? "";
  const ids = [...new Set(raw.split(",").map((s) => s.trim()).filter((s) => OBJECT_ID_RE.test(s)))].slice(0, 50);
  if (ids.length === 0) return res.json([]);

  const orders = await Order.find({ _id: { $in: ids } }).sort({ createdAt: -1 });

  const storeIds = [...new Set(orders.map((o) => o.storeId.toString()))];
  const stores = await Store.find({ _id: { $in: storeIds } }).select("name slug");
  const storeById = new Map(stores.map((s) => [s.id, s]));

  res.json(
    orders.map((o) => ({
      ...o.toJSON(),
      storeName: storeById.get(o.storeId.toString())?.name ?? "Shop",
      storeSlug: storeById.get(o.storeId.toString())?.slug ?? "",
    }))
  );
});

/** GET /api/customer/orders — order history for the logged-in customer. */
export const getMyOrdersCustomer = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ customerId: req.user!.id }).sort({ createdAt: -1 });

  const storeIds = [...new Set(orders.map((o) => o.storeId.toString()))];
  const stores = await Store.find({ _id: { $in: storeIds } }).select("name slug");
  const storeById = new Map(stores.map((s) => [s.id, s]));

  res.json(
    orders.map((o) => ({
      ...o.toJSON(),
      storeName: storeById.get(o.storeId.toString())?.name ?? "Shop",
      storeSlug: storeById.get(o.storeId.toString())?.slug ?? "",
    }))
  );
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
