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
    throw new Error(`Safepay tracker init failed (HTTP ${res.status}): ${body}`);
  }
  const json = (await res.json()) as { data?: { tracker?: { token?: string } }; errors?: unknown };
  const token = json.data?.tracker?.token;
  if (!token) throw new Error(`Safepay did not return a tracker token. Response: ${JSON.stringify(json)}`);

  const tbtRes = await fetch(`${API_BASE}/client/passport/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SFPY-MERCHANT-SECRET": env.safepayWebhookSecret,
    },
  });
  if (!tbtRes.ok) {
    const body = await tbtRes.text().catch(() => "");
    throw new Error(`Safepay passport (tbt) failed (HTTP ${tbtRes.status}): ${body}`);
  }
  const tbtJson = (await tbtRes.json()) as { data?: string };
  const tbt = tbtJson.data;
  if (!tbt) throw new Error(`Safepay did not return a tbt token. Response: ${JSON.stringify(tbtJson)}`);

  const params = new URLSearchParams({
    environment: env.safepayEnv,
    tracker: token,
    tbt,
    source: "bazaarnagar",
    order_id: input.orderId,
    redirect_url: input.redirectUrl,
    cancel_url: input.cancelUrl,
  });
  return `${EMBEDDED_BASE}/?${params.toString()}`;
}

/**
 * Verify the signature Safepay appends when it redirects the customer back:
 * `sig` must equal HMAC-SHA256(tracker, secret). This is how the WooCommerce
 * plugin validates a completed payment.
 */
export function verifyReturnSignature(tracker?: string, sig?: string): boolean {
  if (!env.safepayWebhookSecret || !tracker || !sig) return false;
  const expected = crypto
    .createHmac("sha256", env.safepayWebhookSecret)
    .update(tracker)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

/** Verify a Safepay webhook signature (HMAC-SHA256 of the raw request body). */
export function verifySafepaySignature(rawBody: Buffer, signature?: string): boolean {
  if (!env.safepayWebhookSecret || !signature) return false;
  const expected = crypto
    .createHmac("sha256", env.safepayWebhookSecret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
