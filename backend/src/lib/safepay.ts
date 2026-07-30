import crypto from "crypto";
import { env } from "../config/env";

/**
 * Safepay (https://getsafepay.com) — a Pakistani payment aggregator that
 * accepts EasyPaisa, JazzCash and cards in a single hosted checkout.
 *
 * When SAFEPAY_API_KEY is set we use Safepay's real hosted checkout; otherwise
 * we run in MOCK mode (a local test gateway) so the whole flow can be demoed
 * and tested before merchant credentials exist (graceful null/mock when
 * unconfigured). Flow mirrors Safepay's official WooCommerce plugin.
 */
export const safepayEnabled = Boolean(env.safepayApiKey);

// API host (create the payment session / tracker).
const API_BASE =
  env.safepayEnv === "production"
    ? "https://api.getsafepay.com"
    : "https://sandbox.api.getsafepay.com";

// Hosted checkout host (where the customer actually pays).
const EMBEDDED_BASE =
  env.safepayEnv === "production"
    ? "https://getsafepay.com/embedded"
    : "https://sandbox.api.getsafepay.com/embedded";

export interface SafepaySessionInput {
  amount: number; // PKR, major units
  orderId: string;
  redirectUrl: string; // Safepay sends the customer here after paying (with ?tracker=&sig=)
  cancelUrl: string;
}

/**
 * Create a Safepay hosted-checkout URL. Calls `order/v1/init` to obtain a
 * tracker token, then builds the `/embedded` checkout URL. Throws a clear
 * error if Safepay rejects the request.
 */
export async function createSafepaySession(input: SafepaySessionInput): Promise<string> {
  console.log(`[safepay] creating session (env=${env.safepayEnv}) order_id=${input.orderId} amount=${input.amount} redirect_url=${input.redirectUrl}`);

  const res = await fetch(`${API_BASE}/order/payments/v3/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_api_key: env.safepayApiKey,
      intent: "CYBERSOURCE",
      mode: "payment",
      currency: "PKR",
      amount: Math.round(input.amount * 100),
      order_id: input.orderId,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[safepay] tracker init failed (HTTP ${res.status}) order_id=${input.orderId}: ${body}`);
    throw new Error(`Safepay tracker init failed (HTTP ${res.status}): ${body}`);
  }
  const json = (await res.json()) as { data?: { tracker?: { token?: string } }; errors?: unknown };
  const token = json.data?.tracker?.token;
  if (!token) {
    console.error(`[safepay] no tracker token in init response order_id=${input.orderId}: ${JSON.stringify(json)}`);
    throw new Error(`Safepay did not return a tracker token. Response: ${JSON.stringify(json)}`);
  }
  console.log(`[safepay] tracker created order_id=${input.orderId} tracker=${token}`);

  const tbtRes = await fetch(`${API_BASE}/client/passport/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SFPY-MERCHANT-SECRET": env.safepayWebhookSecret,
    },
  });
  if (!tbtRes.ok) {
    const body = await tbtRes.text().catch(() => "");
    console.error(`[safepay] passport (tbt) failed (HTTP ${tbtRes.status}) tracker=${token}: ${body}`);
    throw new Error(`Safepay passport (tbt) failed (HTTP ${tbtRes.status}): ${body}`);
  }
  const tbtJson = (await tbtRes.json()) as { data?: string };
  const tbt = tbtJson.data;
  if (!tbt) {
    console.error(`[safepay] no tbt token in passport response tracker=${token}: ${JSON.stringify(tbtJson)}`);
    throw new Error(`Safepay did not return a tbt token. Response: ${JSON.stringify(tbtJson)}`);
  }

  const params = new URLSearchParams({
    environment: env.safepayEnv,
    tracker: token,
    tbt,
    source: "bazaarnagar",
    order_id: input.orderId,
    redirect_url: input.redirectUrl,
    cancel_url: input.cancelUrl,
    // The official SDK's checkout builder defaults this to false — without
    // it, Safepay may not fire a webhook for this specific transaction at all.
    webhooks: "true",
  });
  const checkoutUrl = `${EMBEDDED_BASE}/?${params.toString()}`;
  console.log(`[safepay] checkout url ready order_id=${input.orderId} tracker=${token}`);
  return checkoutUrl;
}

/** Fetch order_id stored against a tracker from Safepay API. */
export async function getTrackerOrderId(tracker: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/order/payments/v3/${tracker}`, {
      headers: { "X-SFPY-MERCHANT-SECRET": env.safepayWebhookSecret },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[safepay] getTrackerOrderId lookup failed (HTTP ${res.status}) tracker=${tracker}: ${body}`);
      return null;
    }
    const json = (await res.json()) as {
      data?: { tracker?: { metadata?: { order_id?: string }; order_id?: string } };
    };
    console.log(`[safepay] getTrackerOrderId response tracker=${tracker}: ${JSON.stringify(json)}`);
    return (
      json.data?.tracker?.metadata?.order_id ??
      json.data?.tracker?.order_id ??
      null
    );
  } catch (err) {
    console.error(`[safepay] getTrackerOrderId threw tracker=${tracker}:`, err);
    return null;
  }
}

/**
 * Verify the signature Safepay appends when it redirects the customer back:
 * `sig` must equal HMAC-SHA256(tracker, secret). This is how the WooCommerce
 * plugin validates a completed payment.
 */
export function verifyReturnSignature(tracker?: string, sig?: string): boolean {
  if (!env.safepayWebhookSecret || !tracker || !sig) {
    console.warn(`[safepay] verifyReturnSignature missing input hasSecret=${Boolean(env.safepayWebhookSecret)} tracker=${tracker} sig=${sig}`);
    return false;
  }
  const expected = crypto
    .createHmac("sha256", env.safepayWebhookSecret)
    .update(tracker)
    .digest("hex");
  try {
    const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
    if (!ok) console.warn(`[safepay] verifyReturnSignature mismatch tracker=${tracker} expected=${expected} got=${sig}`);
    return ok;
  } catch (err) {
    console.error(`[safepay] verifyReturnSignature threw tracker=${tracker}:`, err);
    return false;
  }
}

/**
 * Verify a Safepay webhook signature. Confirmed against the official
 * @sfpy/node-sdk source (dist/resources/verify.js) and a live test-event
 * delivery: it's HMAC-SHA512, keyed with the per-endpoint "shared secret"
 * from the dashboard's Endpoints page (NOT the merchant secret key from the
 * API page), computed over `JSON.stringify(parsedBody.data)` — i.e. only the
 * inner "data" object re-serialized, not the raw top-level request body.
 */
export function verifySafepaySignature(rawBody: Buffer, signature?: string): boolean {
  if (!env.safepayWebhookSharedSecret || !signature) {
    console.warn(`[safepay] verifySafepaySignature missing input hasSecret=${Boolean(env.safepayWebhookSharedSecret)} signature=${signature}`);
    return false;
  }
  let dataString: string;
  try {
    dataString = JSON.stringify(JSON.parse(rawBody.toString()).data);
  } catch (err) {
    console.error(`[safepay] verifySafepaySignature: body is not valid JSON:`, err);
    return false;
  }
  const expected = crypto
    .createHmac("sha512", env.safepayWebhookSharedSecret)
    .update(dataString)
    .digest("hex");
  try {
    const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    if (!ok) console.warn(`[safepay] verifySafepaySignature mismatch expected=${expected} got=${signature}`);
    return ok;
  } catch (err) {
    console.error(`[safepay] verifySafepaySignature threw:`, err);
    return false;
  }
}
