import type { Request, Response } from "express";
import type Stripe from "stripe";
import { z } from "zod";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { Order } from "../models/Order";
import { requireStripe } from "../lib/stripe";
import { env } from "../config/env";
import { ApiError, asyncHandler } from "../lib/helpers";

/** Resolve the authenticated seller + their store. */
async function sellerStore(req: Request) {
  const seller = await Seller.findById(req.user!.id);
  if (!seller?.storeId) throw new ApiError(400, "Create your store profile first");
  const store = await Store.findById(seller.storeId);
  if (!store) throw new ApiError(404, "Store not found");
  return { seller, store };
}

/** POST /api/seller/stripe/onboard — start (or resume) Stripe Connect onboarding. */
export const onboard = asyncHandler(async (req: Request, res: Response) => {
  const sc = requireStripe();
  const { seller, store } = await sellerStore(req);

  let accountId = store.stripe?.accountId;
  if (!accountId) {
    const account = await sc.accounts.create({
      type: "express",
      email: seller.email,
      business_profile: { name: store.name },
      metadata: { storeId: store.id },
    });
    accountId = account.id;
    store.stripe = { connected: false, chargesEnabled: false, accountId, email: seller.email };
    await store.save();
  }

  const link = await sc.accountLinks.create({
    account: accountId,
    refresh_url: `${env.appUrl}/dashboard/settings?stripe=refresh`,
    return_url: `${env.appUrl}/dashboard/settings?stripe=return`,
    type: "account_onboarding",
  });

  res.json({ url: link.url });
});

/** GET /api/seller/stripe/status — refresh the connected account's status. */
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const sc = requireStripe();
  const { store } = await sellerStore(req);
  if (!store.stripe?.accountId) return res.json(store.toJSON());

  const account = await sc.accounts.retrieve(store.stripe.accountId);
  store.stripe = {
    accountId: store.stripe.accountId,
    connected: Boolean(account.charges_enabled),
    chargesEnabled: Boolean(account.charges_enabled),
    email: account.email ?? store.stripe.email,
  };
  await store.save();
  res.json(store.toJSON());
});

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

/** POST /api/public/checkout — create a card order + Stripe Checkout Session. */
export const createCheckout = asyncHandler(async (req: Request, res: Response) => {
  const sc = requireStripe();
  const data = checkoutSchema.parse(req.body);

  const store = await Store.findOne({ _id: data.storeId, status: "active" });
  if (!store) throw new ApiError(404, "Store not found");
  if (!store.stripe?.accountId || !store.stripe.chargesEnabled) {
    throw new ApiError(400, "This shop isn't set up to accept card payments yet.");
  }

  const items = [];
  let total = 0;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
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
    lineItems.push({
      quantity: line.quantity,
      price_data: {
        currency: "pkr",
        unit_amount: Math.round(price * 100),
        product_data: {
          name: product.name,
          images: product.images[0] ? [product.images[0]] : undefined,
        },
      },
    });
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
    paymentMethod: "card",
    paymentStatus: "unpaid",
  });

  const session = await sc.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${env.appUrl}/checkout/success?order=${order.id}`,
    cancel_url: `${env.appUrl}/cart`,
    payment_intent_data: { transfer_data: { destination: store.stripe.accountId } },
    metadata: { orderId: order.id },
  });

  res.json({ url: session.url, orderId: order.id });
});

/** POST /api/webhooks/stripe — Stripe event webhook (needs the raw request body). */
export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const sc = requireStripe();
  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;
  try {
    event = sc.webhooks.constructEvent(
      req.body as Buffer,
      sig as string,
      env.stripeWebhookSecret
    );
  } catch {
    throw new ApiError(400, "Webhook signature verification failed");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { paymentStatus: "paid", status: "confirmed" });
    }
  } else if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    await Store.findOneAndUpdate(
      { "stripe.accountId": account.id },
      {
        "stripe.connected": Boolean(account.charges_enabled),
        "stripe.chargesEnabled": Boolean(account.charges_enabled),
      }
    );
  }

  res.json({ received: true });
});
