import Stripe from "stripe";
import { env } from "../config/env";
import { ApiError } from "./helpers";

/**
 * Stripe client — `null` until a secret key is configured, so the app runs
 * fine without payments enabled. Use `requireStripe()` inside endpoints.
 */
export const stripe: Stripe | null = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey)
  : null;

export const stripeEnabled = Boolean(stripe);

/** Return the Stripe client or throw a clear 503 if it isn't configured. */
export function requireStripe(): Stripe {
  if (!stripe) {
    throw new ApiError(
      503,
      "Online payments aren't set up yet. Add STRIPE_SECRET_KEY to the server .env to enable Stripe."
    );
  }
  return stripe;
}
