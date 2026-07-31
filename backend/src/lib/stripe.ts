import Stripe from "stripe";
import { env } from "../config/env";

/**
 * Stripe — replaces the old Safepay integration. When STRIPE_SECRET_KEY is
 * unset we run in mock mode (a local test gateway) so checkout can still be
 * demoed without live credentials.
 */
export const stripeEnabled = Boolean(env.stripeSecretKey);

export const stripe = new Stripe(env.stripeSecretKey || "sk_test_mock_key_not_configured");

export interface OrderCheckoutInput {
  amount: number; // major currency units (e.g. dollars)
  orderId: string;
  productName: string;
  successUrl: string;
  cancelUrl: string;
}

/** Create a Stripe Checkout Session for a one-time order payment. */
export async function createOrderCheckoutSession(input: OrderCheckoutInput): Promise<string> {
  console.log(`[stripe] creating order checkout session order_id=${input.orderId} amount=${input.amount}`);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: env.stripeCurrency,
          product_data: { name: input.productName },
          unit_amount: Math.round(input.amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { kind: "order", order_id: input.orderId },
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  console.log(`[stripe] order checkout session ready order_id=${input.orderId} session=${session.id}`);
  return session.url;
}

export interface SubscriptionCheckoutInput {
  amount: number;
  sellerId: string;
  planId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe Checkout Session for a subscription plan payment. Uses
 * one-time "payment" mode (billing periods are tracked manually via
 * addBillingPeriod, matching the rest of this app's subscription model) but
 * saves the card (setup_future_usage) so the scheduler can auto-renew later.
 */
export async function createSubscriptionCheckoutSession(
  input: SubscriptionCheckoutInput
): Promise<{ url: string; sessionId: string }> {
  console.log(`[stripe] creating subscription checkout session sellerId=${input.sellerId} planId=${input.planId} amount=${input.amount}`);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: input.customerEmail,
    line_items: [
      {
        price_data: {
          currency: env.stripeCurrency,
          product_data: { name: `Bazaarnagar ${input.planId} plan subscription` },
          unit_amount: Math.round(input.amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { kind: "subscription", seller_id: input.sellerId, plan_id: input.planId },
    payment_intent_data: { setup_future_usage: "off_session" },
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  console.log(`[stripe] subscription checkout session ready sellerId=${input.sellerId} session=${session.id}`);
  return { url: session.url, sessionId: session.id };
}

/**
 * Verify + parse a Stripe webhook request. Throws if the signature is
 * missing/invalid — official, documented HMAC verification (unlike the
 * reverse-engineered Safepay scheme this replaces).
 */
export function constructWebhookEvent(rawBody: Buffer, signature: string | undefined): Stripe.Event {
  if (!signature) throw new Error("Missing Stripe-Signature header");
  if (!env.stripeWebhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  return stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
}

/** Charge a previously-saved card off-session (used for subscription auto-renewal). */
export async function chargeSavedCard(
  customerId: string,
  paymentMethodId: string,
  amount: number,
  description: string
): Promise<boolean> {
  if (!stripeEnabled) return false;
  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: env.stripeCurrency,
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description,
    });
    return intent.status === "succeeded";
  } catch (err) {
    console.error(`[stripe] off-session charge failed customer=${customerId}:`, err);
    return false;
  }
}
