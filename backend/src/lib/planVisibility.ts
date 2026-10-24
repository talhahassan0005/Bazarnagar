import { Product } from "../models/Product";
import { getLivePlanLimit } from "./plans";
import type { PlanId } from "../models/Seller";

/**
 * Keep a store's public products within its plan's product limit: the oldest
 * `limit` products stay public, the rest get `hiddenOverPlanLimit` (the seller
 * still sees them in the dashboard). Re-running after an upgrade or renewal
 * makes them public again. Returns how many are hidden now.
 */
export async function syncPlanVisibility(seller: {
  planId: PlanId;
  storeId?: unknown;
}): Promise<number> {
  if (!seller.storeId) return 0;
  const limit = await getLivePlanLimit(seller.planId);
  const ids = (await Product.find({ storeId: seller.storeId }).sort({ createdAt: 1, _id: 1 }).select("_id").lean()).map(
    (p) => p._id
  );
  const keep = ids.slice(0, limit);
  const hide = ids.slice(limit);
  await Promise.all([
    keep.length && Product.updateMany({ _id: { $in: keep }, hiddenOverPlanLimit: true }, { $set: { hiddenOverPlanLimit: false } }),
    hide.length && Product.updateMany({ _id: { $in: hide }, hiddenOverPlanLimit: { $ne: true } }, { $set: { hiddenOverPlanLimit: true } }),
  ]);
  return hide.length;
}
