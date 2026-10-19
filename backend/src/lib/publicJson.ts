/**
 * Performance counters are private to the seller and admins — never send them
 * to shoppers. Wrap any store/product JSON returned by a public endpoint.
 */
export function withoutStats<T extends Record<string, unknown>>(json: T): Omit<T, "views" | "whatsappClicks"> {
  const { views: _views, whatsappClicks: _clicks, ...rest } = json;
  return rest;
}
