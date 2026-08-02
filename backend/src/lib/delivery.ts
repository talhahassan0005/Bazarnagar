import type { DeliveryOption } from "../models/Product";

/**
 * Total delivery fee for an order: each distinct product's flat fee, added
 * once (not multiplied by quantity — delivery is charged per shipment, not
 * per unit). Products marked "not_available" or "negotiable" contribute
 * nothing here (negotiable fees are agreed directly with the seller).
 */
export function computeDeliveryFee(
  products: { deliveryOption?: DeliveryOption; deliveryFee?: number }[]
): number {
  let fee = 0;
  for (const p of products) {
    if (p.deliveryOption === "available" && p.deliveryFee) fee += p.deliveryFee;
  }
  return fee;
}
