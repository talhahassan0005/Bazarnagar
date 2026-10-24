import { Settings } from "../models/Settings";
import { GRACE_DAYS } from "./plans";

/** Admin choice for what happens when a paid plan expires and isn't renewed. */
export interface SubscriptionSettings {
  /**
   * true: after `graceDays` (with 3 warning emails) the seller moves to the
   * Free plan and products over its limit are hidden from the public.
   * false: the seller keeps their paid plan's features after it expires.
   */
  downgradeAfterExpiry: boolean;
  graceDays: number;
}

export const DEFAULT_SUBSCRIPTION_SETTINGS: SubscriptionSettings = {
  downgradeAfterExpiry: true,
  graceDays: GRACE_DAYS,
};

export async function getSubscriptionSettings(): Promise<SubscriptionSettings> {
  const s = await Settings.findOne({ key: "subscription" }).lean();
  return {
    downgradeAfterExpiry: s?.downgradeAfterExpiry ?? DEFAULT_SUBSCRIPTION_SETTINGS.downgradeAfterExpiry,
    graceDays: s?.graceDays ?? DEFAULT_SUBSCRIPTION_SETTINGS.graceDays,
  };
}

/** Days after expiry on which the 3 warning emails go out (first one on the day it expires). */
export function warningDays(graceDays: number): number[] {
  return [...new Set([0, Math.floor(graceDays / 2), Math.max(graceDays - 1, 0)])];
}
