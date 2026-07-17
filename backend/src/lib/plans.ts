import type { PlanId } from "../models/Seller";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  productLimit: number;
  imageLimit: number;
  videoLimit: number;
}

/** A product limit at/above this counts as "unlimited" (paid plans). */
export const UNLIMITED = 1_000_000;

/** Plan limits — mirrors frontend/src/lib/constants.ts (SRS §6). */
export const PLANS: Record<PlanId, Plan> = {
  starter: { id: "starter", name: "Starter", price: 100, productLimit: 5, imageLimit: 1, videoLimit: 0 },
  basic: { id: "basic", name: "Basic", price: 500, productLimit: UNLIMITED, imageLimit: 3, videoLimit: 0 },
  growth: { id: "growth", name: "Growth", price: 1000, productLimit: UNLIMITED, imageLimit: 5, videoLimit: 1 },
  pro: { id: "pro", name: "Pro", price: 5000, productLimit: UNLIMITED, imageLimit: 8, videoLimit: 2 },
};

export function getPlan(planId: PlanId): Plan {
  return PLANS[planId] ?? PLANS.starter;
}

/* ----------------------------- Subscriptions ----------------------------- */

/** Length of one billing cycle (monthly). */
export const BILLING_DAYS = 30;
/** Days after expiry before an unpaid subscription is cancelled (grace period). */
export const GRACE_DAYS = 7;
/** Length of the free trial for a new seller. */
export const TRIAL_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Add one billing cycle to a date (defaults to now). */
export function addBillingPeriod(from: Date = new Date()): Date {
  return new Date(from.getTime() + BILLING_DAYS * DAY_MS);
}

/** Add the trial length to a date (defaults to now). */
export function addTrialPeriod(from: Date = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * DAY_MS);
}
