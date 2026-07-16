import type { Request, Response } from "express";
import { z } from "zod";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { Order } from "../models/Order";
import { env } from "../config/env";
import { ApiError, asyncHandler } from "../lib/helpers";
import {
  safepayEnabled,
  createSafepaySession,
  verifyReturnSignature,
  verifySafepaySignature,
} from "../lib/safepay";

const checkoutSchema = z.object({
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

const effectivePrice = (price: number, discountPrice?: number) =>
  discountPrice != null && discountPrice < price ? discountPrice : price;

/**
 * POST /api/public/safepay/checkout — create an online order (EasyPaisa /
 * JazzCash / card via Safepay). Returns a URL to send the customer to. In mock
 * mode (no API key) the URL points at our own test gateway page.
 */
export const createSafepayCheckout = asyncHandler(async (req: Request, res: Response) => {
  const data = checkoutSchema.parse(req.body);

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
    paymentMethod: "online",
    paymentStatus: "unpaid",
  });

  if (safepayEnabled) {
    // Safepay redirects the customer back to our backend callback (with
    // ?tracker=&sig=) so we can verify the signature server-side before
    // confirming the order.
    const url = await createSafepaySession({
      amount: total,
      orderId: order.id,
      redirectUrl: `${env.publicUrl}/api/public/safepay/callback?order=${order.id}`,
      cancelUrl: `${env.appUrl}/cart`,
    });
    return res.json({ url, orderId: order.id, mock: false });
  }

  // Mock mode — no credentials yet: send the customer to our local test gateway.
  const url = `${env.appUrl}/checkout/pay?order=${order.id}&amount=${total}`;
  res.json({ url, orderId: order.id, mock: true });
});

/**
 * POST /api/public/safepay/mock-confirm — simulate a successful gateway
 * callback. Only allowed in mock mode (for local demo/testing).
 */
export const mockConfirmSafepay = asyncHandler(async (req: Request, res: Response) => {
  if (safepayEnabled) {
    throw new ApiError(400, "Live payments are enabled — use the real gateway.");
  }
  const { orderId } = z.object({ orderId: z.string().min(1) }).parse(req.body);
  const order = await Order.findByIdAndUpdate(
    orderId,
    { paymentStatus: "paid", status: "confirmed" },
    { new: true }
  );
  if (!order) throw new ApiError(404, "Order not found");
  res.json(order.toJSON());
});

/** GET /api/public/payment-config — tells the frontend if live online payments
 *  are enabled (hosted redirect) or running in local mock mode (inline test). */
export const getPaymentConfig = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ hosted: safepayEnabled });
});

/**
 * GET /api/public/safepay/callback — where Safepay sends the customer after
 * paying. Verifies the signature, marks the order paid, then redirects to the
 * frontend success (or cart on failure).
 */
export const safepayCallback = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.query.order as string | undefined;
  const tracker = req.query.tracker as string | undefined;
  const sig = req.query.sig as string | undefined;

  if (orderId && verifyReturnSignature(tracker, sig)) {
    await Order.findByIdAndUpdate(orderId, { paymentStatus: "paid", status: "confirmed" });
    return res.redirect(`${env.appUrl}/checkout/success?order=${orderId}`);
  }
  res.redirect(`${env.appUrl}/cart?payment=failed`);
});

/** POST /api/webhooks/safepay — Safepay event webhook (needs the raw body). */
export const safepayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers["x-sfpy-signature"] as string | undefined;
  const raw = req.body as Buffer;
  if (!verifySafepaySignature(raw, sig)) {
    throw new ApiError(400, "Webhook signature verification failed");
  }

  const event = JSON.parse(raw.toString()) as {
    type?: string;
    event?: string;
    data?: { order_id?: string; metadata?: { order_id?: string } };
  };
  const orderId = event.data?.metadata?.order_id ?? event.data?.order_id;
  const kind = event.type ?? event.event ?? "";
  if (orderId && /paid|success|complete/i.test(kind)) {
    await Order.findByIdAndUpdate(orderId, { paymentStatus: "paid", status: "confirmed" });
  }

  res.json({ received: true });
});
