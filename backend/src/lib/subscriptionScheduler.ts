import { Seller } from "../models/Seller";
import { Payment } from "../models/Payment";
import { Product } from "../models/Product";
import { PlanConfig } from "../models/PlanConfig";
import type { PlanId } from "../models/Seller";
import { addBillingPeriod, getLivePlanLimit, getPlan } from "./plans";
import { syncPlanVisibility } from "./planVisibility";
import { getSubscriptionSettings, warningDays } from "./subscriptionSettings";
import { sendMail } from "./mailer";
import { quotePlan } from "./paymentPricing";
import { planDowngradedEmail, planExpiryWarningEmail } from "./emails";
import { chargeSavedCard } from "./stripe";

const DAY_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly
const MAX_RETRIES = 3;

/**
 * Main subscription lifecycle processor — runs hourly:
 * 1. Auto-renew: charge sellers whose nextChargeDate <= now and autoRenew=true
 * 2. Expire: active/trial past endDate with autoRenew=false
 * 3. Lapsed: warn during the grace period, then move to the Free plan (admin setting)
 * 4. Keep hidden-over-limit products in sync with each shop's plan
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
    // Renew in the currency they last paid in, at today's admin-set price (+ USD tax).
    const quote = await quotePlan(seller.planId, seller.billingCurrency ?? "PKR", "card").catch(() => null);
    const success =
      quote != null &&
      (await chargeSavedCard(
        seller.stripeCustomerId!,
        seller.stripePaymentMethodId!,
        quote.total,
        `Bazaarnagar ${seller.planId} plan renewal`,
        quote.currency
      ));

    if (success) {
      const base = seller.subscriptionEndsAt && seller.subscriptionEndsAt > now
        ? seller.subscriptionEndsAt : now;
      seller.subscriptionEndsAt = addBillingPeriod(base);
      seller.retryCount = 0;
      await seller.save();

      await Payment.create({
        sellerId: seller._id,
        planId: seller.planId,
        amount: quote!.total,
        currency: quote!.currency,
        taxAmount: quote!.tax,
        cardFeeAmount: quote!.cardFee,
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

  // The free (starter) plan never expires — only paid plans are aged out below.
  const paidPlan = { planId: { $ne: "starter" } };

  // ── 2. Expire subscriptions past endDate with autoRenew=false ─────────────
  await Seller.updateMany(
    {
      ...paidPlan,
      subscriptionStatus: { $in: ["active", "trial"] },
      autoRenew: false,
      subscriptionEndsAt: { $ne: null, $lt: now },
    },
    { $set: { subscriptionStatus: "expired" } }
  );

  // Also expire active subs with no card token and no autoRenew
  await Seller.updateMany(
    {
      ...paidPlan,
      subscriptionStatus: { $in: ["active", "trial"] },
      subscriptionEndsAt: { $ne: null, $lt: now },
    },
    { $set: { subscriptionStatus: "expired" } }
  );

  // ── 3. Lapsed paid plans: warn, then move to Free (admin setting) ──────────
  await processLapsedPlans(now);

  // ── 4. Re-check product visibility for shops with hidden products (catches
  // renewals / upgrades / deleted products from any path).
  const withHidden: unknown[] = await Product.distinct("storeId", { hiddenOverPlanLimit: true });
  if (withHidden.length > 0) {
    const sellers = await Seller.find({ storeId: { $in: withHidden } }).select("planId storeId");
    for (const seller of sellers) await syncPlanVisibility(seller);
  }
}

/** Plan's display name, including the admin's Plan Settings rename. */
async function planName(planId: PlanId): Promise<string> {
  const override = await PlanConfig.findOne({ planId }).select("name").lean();
  return override?.name?.trim() || getPlan(planId).name;
}

/**
 * Paid plans past their end date that weren't renewed. When the admin has
 * "move to Free after expiry" on: send up to 3 warning emails during the
 * grace period, then switch the seller to the Free plan. Products over the
 * Free limit are hidden from the public (not deleted) until they renew.
 * When it's off, sellers simply keep their plan's features.
 */
export async function processLapsedPlans(now = new Date()): Promise<void> {
  const settings = await getSubscriptionSettings();
  if (!settings.downgradeAfterExpiry) return;

  const lapsed = await Seller.find({
    planId: { $ne: "starter" },
    subscriptionStatus: { $in: ["expired", "cancelled"] },
    subscriptionEndsAt: { $ne: null, $lt: now },
  });
  const thresholds = warningDays(settings.graceDays);
  const freeLimit = await getLivePlanLimit("starter");

  for (const seller of lapsed) {
    const daysSince = Math.floor((now.getTime() - seller.subscriptionEndsAt!.getTime()) / DAY_MS);
    const name = await planName(seller.planId);
    const productCount = seller.storeId ? await Product.countDocuments({ storeId: seller.storeId }) : 0;

    if (daysSince >= settings.graceDays) {
      seller.downgradedFromPlanId = seller.planId;
      seller.planId = "starter";
      seller.subscriptionStatus = "active";
      seller.subscriptionEndsAt = undefined;
      seller.autoRenew = false;
      seller.expiryWarningsSent = 0;
      await seller.save(); // the Seller save hook hides products over the Free limit
      const hiddenCount = seller.storeId
        ? await Product.countDocuments({ storeId: seller.storeId, hiddenOverPlanLimit: true })
        : 0;
      await sendMail({ to: seller.email, ...planDowngradedEmail({ name: seller.name, planName: name, freeLimit, hiddenCount }) }).catch(
        (err) => console.error("Failed to send plan downgrade email:", err)
      );
      console.log(`  ↳ Moved to Free plan after lapse: ${seller.email} (${hiddenCount} product(s) hidden)`);
      continue;
    }

    // One email per hourly run at most: only the latest warning that's due.
    const due = thresholds.filter((d) => daysSince >= d).length;
    if (due > (seller.expiryWarningsSent ?? 0)) {
      seller.expiryWarningsSent = due;
      await seller.save();
      await sendMail({
        to: seller.email,
        ...planExpiryWarningEmail({
          name: seller.name,
          planName: name,
          daysLeft: settings.graceDays - daysSince,
          freeLimit,
          productCount,
          warning: due,
        }),
      }).catch((err) => console.error("Failed to send plan expiry warning:", err));
      console.log(`  ↳ Plan expiry warning ${due}/${thresholds.length}: ${seller.email}`);
    }
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
