import type { PlanId } from "../models/Seller";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  productLimit: number;
  imageLimit: number;
  videoLimit: number;
}

/** Plan limits — mirrors frontend/src/lib/constants.ts (SRS §6). */
export const PLANS: Record<PlanId, Plan> = {
  starter: { id: "starter", name: "Starter", price: 100, productLimit: 5, imageLimit: 1, videoLimit: 0 },
  basic: { id: "basic", name: "Basic", price: 500, productLimit: 50, imageLimit: 3, videoLimit: 0 },
  growth: { id: "growth", name: "Growth", price: 1000, productLimit: 100, imageLimit: 5, videoLimit: 1 },
  pro: { id: "pro", name: "Pro", price: 5000, productLimit: 1000, imageLimit: 8, videoLimit: 2 },
};

export function getPlan(planId: PlanId): Plan {
  return PLANS[planId] ?? PLANS.starter;
}
