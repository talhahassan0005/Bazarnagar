import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { GRACE_DAYS } from "./plans";

const DAY_MS = 24 * 60 * 60 * 1000;
/** How often the scheduler re-checks subscriptions. */
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

/**
 * Move subscriptions through their lifecycle based on the current time:
 *  1. active/trial past their end date  → "expired" (grace period begins)
 *  2. expired past the grace period      → "cancelled" + the shop is hidden
 *
 * Renewing (see sellerController) resets the period and reactivates the shop.
 * Safe to run repeatedly; it only touches rows that have actually lapsed.
 */
export async function processSubscriptions(): Promise<void> {
  const now = new Date();

  // 1) Lapsed → expired.
  await Seller.updateMany(
    {
      subscriptionStatus: { $in: ["active", "trial"] },
      subscriptionEndsAt: { $ne: null, $lt: now },
    },
    { $set: { subscriptionStatus: "expired" } }
  );

  // 2) Expired beyond the grace window → cancelled, and hide the shop.
  const graceCutoff = new Date(now.getTime() - GRACE_DAYS * DAY_MS);
  const toCancel = await Seller.find({
    subscriptionStatus: "expired",
    subscriptionEndsAt: { $ne: null, $lt: graceCutoff },
  });

  for (const seller of toCancel) {
    seller.subscriptionStatus = "cancelled";
    await seller.save();
    if (seller.storeId) {
      await Store.updateOne({ _id: seller.storeId }, { status: "inactive" });
    }
  }

  if (toCancel.length > 0) {
    console.log(`  ↳ Subscriptions: cancelled ${toCancel.length} lapsed subscription(s).`);
  }
}

/** Start the recurring subscription check (runs once now, then hourly). */
export function startSubscriptionScheduler(): void {
  processSubscriptions().catch((err) =>
    console.error("Subscription check failed:", err)
  );
  setInterval(() => {
    processSubscriptions().catch((err) =>
      console.error("Subscription check failed:", err)
    );
  }, CHECK_INTERVAL_MS);
  console.log("✓ Subscription scheduler started (hourly)");
}
