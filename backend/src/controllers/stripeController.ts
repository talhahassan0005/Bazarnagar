import type { Request, Response } from "express";
import { z } from "zod";
import Stripe from "stripe";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { Order } from "../models/Order";
import { Seller } from "../models/Seller";
import { Payment } from "../models/Payment";
import { getPlan, addBillingPeriod } from "../lib/plans";
import { env } from "../config/env";
import { ApiError, asyncHandler } from "../lib/helpers";
import { stripe, stripeEnabled, createOrderCheckoutSession, constructWebhookEvent } from "../lib/stripe";
import { computeDeliveryFee } from "../lib/delivery";
import type { PlanId } from "../models/Seller";

const checkoutSchema = z.object({
  storeId: z.string().min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().min(6),
  customerEmail: z.string().email("Enter a valid email to receive your payment receipt"),
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
 * POST /api/public/stripe/checkout — create an online order (card via
 * Stripe). Returns a URL to send the customer to. In mock mode (no secret
 * key) the URL points at our own test gateway page.
 */
export const createStripeCheckout = asyncHandler(async (req: Request, res: Response) => {
  const data = checkoutSchema.parse(req.body);

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
  const total = subtotal + deliveryFee;

  const order = await Order.create({
    storeId: store._id,
    customerId: req.user?.role === "customer" ? req.user.id : undefined,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    customerAddress: data.customerAddress,
    customerCity: data.customerCity,
    note: data.note,
    items,
    subtotal,
    deliveryFee,
    total,
    paymentMethod: "online",
    paymentStatus: "unpaid",
  });

  if (stripeEnabled) {
    // Stripe redirects the browser straight to our frontend success page —
    // the webhook (server-to-server) is what actually confirms payment.
    const url = await createOrderCheckoutSession({
      amount: total,
      orderId: order.id,
      productName: `Bazaarnagar order at ${store.name}`,
      customerEmail: data.customerEmail,
      successUrl: `${env.appUrl}/checkout/success?order=${order.id}`,
      cancelUrl: `${env.appUrl}/cart?payment=cancelled`,
    });
    return res.json({ url, orderId: order.id, mock: false });
  }

  // Mock mode — no credentials yet: send the customer to our local test gateway.
  const url = `${env.appUrl}/checkout/pay?order=${order.id}&amount=${total}`;
  res.json({ url, orderId: order.id, mock: true });
});

/**
 * POST /api/public/stripe/mock-confirm — simulate a successful gateway
 * callback. Only allowed in mock mode (for local demo/testing).
 */
export const mockConfirmOrder = asyncHandler(async (req: Request, res: Response) => {
  if (stripeEnabled) {
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
  res.json({ hosted: stripeEnabled });
});

/** POST /api/webhooks/stripe — Stripe event webhook (needs the raw body). */
export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const raw = req.body as Buffer;

  console.log(`[stripe] webhook received, bytes=${raw?.length ?? 0}`);

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(raw, sig);
  } catch (err) {
    console.error(`[stripe] webhook signature verification failed:`, err);
    throw new ApiError(400, "Webhook signature verification failed");
  }

  console.log(`[stripe] webhook verified type=${event.type}`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};

    if (metadata.kind === "subscription" && metadata.seller_id && metadata.plan_id) {
      const seller = await Seller.findById(metadata.seller_id);
      if (!seller) {
        console.error(`[stripe] webhook: seller not found sellerId=${metadata.seller_id}`);
      } else {
        const planId = metadata.plan_id as PlanId;
        const plan = getPlan(planId);
        const now = new Date();

        seller.planId = planId;
        seller.subscriptionStatus = "active";
        seller.subscriptionStartedAt = now;
        seller.subscriptionEndsAt = addBillingPeriod(now);
        seller.autoRenew = false;

        if (typeof session.customer === "string") seller.stripeCustomerId = session.customer;
        if (typeof session.payment_intent === "string") {
          try {
            const intent = await stripe.paymentIntents.retrieve(session.payment_intent);
            if (typeof intent.payment_method === "string") {
              seller.stripePaymentMethodId = intent.payment_method;
            }
          } catch (err) {
            console.error(`[stripe] failed to retrieve payment intent ${session.payment_intent}:`, err);
          }
        }
        await seller.save();

        await Payment.create({
          sellerId: seller._id,
          planId,
          amount: plan.price,
          method: "card",
          paidAt: now,
          notes: "Subscription via Stripe",
        });
        if (seller.storeId) {
          await Store.updateOne({ _id: seller.storeId }, { status: "active" });
        }
        console.log(`[stripe] webhook activated subscription sellerId=${seller.id} planId=${planId} endsAt=${seller.subscriptionEndsAt?.toISOString()}`);
      }
    } else if (metadata.order_id) {
      const updated = await Order.findByIdAndUpdate(metadata.order_id, {
        paymentStatus: "paid",
        status: "confirmed",
      });
      console.log(`[stripe] webhook confirmed order orderId=${metadata.order_id} found=${Boolean(updated)}`);
    } else {
      console.warn(`[stripe] webhook: checkout.session.completed with no recognizable metadata`, metadata);
    }
  }

  res.json({ received: true });
});
