import type { StoreDoc, StoreReview } from "../models/Store";

/** Store fields whose changes put the store back in the admin review queue. */
const REVIEWED_FIELDS = new Set([
  "name",
  "description",
  "category",
  "whatsapp",
  "city",
  "area",
  "fullAddress",
  "mapsLink",
  "lat",
  "lng",
  "logoUrl",
  "coverUrl",
  "showLocation",
  "showInSearch",
  "isOpen",
  "socials",
  "deliveryInfo",
  "noDelivery",
  "paymentInfo",
  "landing",
]);

/** A brand-new store waiting for its first review. */
export function newStoreReview(): StoreReview {
  return { status: "pending", reason: "created", changes: [], requestedAt: new Date() };
}

/**
 * Queue an edited store for review, recording which fields changed. If it's
 * already waiting, the new changes are added to the list (a new store stays
 * "created").
 */
export function queueStoreReview(store: StoreDoc, changedPaths: string[]): void {
  const changes = [...new Set(changedPaths.map((p) => p.split(".")[0]!))].filter((f) => REVIEWED_FIELDS.has(f));
  if (changes.length === 0) return;

  const current = store.review;
  store.review =
    current?.status === "pending"
      ? {
          ...current,
          changes: [...new Set([...(current.changes ?? []), ...changes])],
          requestedAt: new Date(),
        }
      : { status: "pending", reason: "updated", changes, requestedAt: new Date() };
}
