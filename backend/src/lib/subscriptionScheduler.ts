import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Payment } from "../models/Payment";
import { GRACE_DAYS, addBillingPeriod, getPlan } from "./plans";
import { chargeSavedCard } from "./stripe";

const DAY_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly
const MAX_RETRIES = 3;

/**
 * Main subscription lifecycle processor — runs hourly:
 * 1. Auto-renew: charge sellers whose nextChargeDate <= now and autoRenew=true
 * 2. Expire: active/trial past endDate with autoRenew=false
 * 3. Cancel: expired past grace window → hide shop
 */
export async function processSubscriptions(): Promise<void> {
  const now = new Date();

  // ── 1. Auto-renewal ────────────────────────────────────────────────────────
  const toRenew = await Seller.find({
    subscriptionStatus: "active",
    autoRenew: true,
    stripeCustomerId: { $exists: true, $ne: "" },
    stripePaymentMethodId: { $exists: true, $ne: "" },
    subscriptionEndsAt: { $ne: null, $lte: now },
  });

  for (const seller of toRenew) {
    const plan = getPlan(seller.planId);
    const success = await chargeSavedCard(
      seller.stripeCustomerId!,
      seller.stripePaymentMethodId!,
      plan.price,
      `Bazaarnagar ${seller.planId} plan renewal`
    );

    if (success) {
      const base = seller.subscriptionEndsAt && seller.subscriptionEndsAt > now
        ? seller.subscriptionEndsAt : now;
      seller.subscriptionEndsAt = addBillingPeriod(base);
      seller.retryCount = 0;
      await seller.save();

      await Payment.create({
        sellerId: seller._id,
        planId: seller.planId,
        amount: plan.price,
        method: "card",
        paidAt: now,
        notes: "Auto-renewal via saved card",
      });
      console.log(`  ↳ Auto-renewed: ${seller.email}`);
    } else {
      seller.retryCount = (seller.retryCount ?? 0) + 1;
      if (seller.retryCount >= MAX_RETRIES) {
        seller.subscriptionStatus = "expired";
        seller.autoRenew = false;
        console.log(`  ↳ Auto-renewal failed after ${MAX_RETRIES} retries: ${seller.email}`);
      } else {
        console.log(`  ↳ Auto-renewal retry ${seller.retryCount}/${MAX_RETRIES}: ${seller.email}`);
      }
      await seller.save();
    }
  }

  // ── 2. Expire subscriptions past endDate with autoRenew=false ─────────────
  await Seller.updateMany(
    {
      subscriptionStatus: { $in: ["active", "trial"] },
      autoRenew: false,
      subscriptionEndsAt: { $ne: null, $lt: now },
    },
    { $set: { subscriptionStatus: "expired" } }
  );

  // Also expire active subs with no card token and no autoRenew
  await Seller.updateMany(
    {
      subscriptionStatus: { $in: ["active", "trial"] },
      subscriptionEndsAt: { $ne: null, $lt: now },
    },
    { $set: { subscriptionStatus: "expired" } }
  );

  // ── 3. Cancel + hide shop after grace period ───────────────────────────────
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
