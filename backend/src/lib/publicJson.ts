/** Counters that are private to the seller and admins. */
type Stats = "views" | "whatsappClicks" | "addToCartClicks" | "buyNowClicks";

/**
 * Performance counters are private to the seller and admins — never send them
 * to shoppers. Wrap any store/product JSON returned by a public endpoint.
 */
export function withoutStats<T extends Record<string, unknown>>(json: T): Omit<T, Stats> {
  const {
    views: _views,
    whatsappClicks: _clicks,
    addToCartClicks: _cart,
    buyNowClicks: _buyNow,
    ...rest
  } = json;
  return rest;
}
