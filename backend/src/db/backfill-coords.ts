/**
 * Backfill store coordinates by city — WITHOUT wiping any data.
 *
 * "Near me" needs shops to have lat/lng. Existing shops created before that
 * feature (or via signup) have none, so distance is always undefined and the
 * list never reorders. This script fills coords for any store missing them,
 * derived from its city (with a small random jitter so nearby shops don't all
 * stack on the exact same pin). Products fall back to their store's location,
 * so updating stores is enough.
 *
 * Safe to re-run. Run with: `npm run backfill:coords`.
 */
import mongoose from "mongoose";
import { connectDB } from "./connect";
import { Store } from "../models/Store";

/** Approx city-centre coordinates for Pakistan's major cities. */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Rawalpindi: { lat: 33.5651, lng: 73.0169 },
  Faisalabad: { lat: 31.418, lng: 73.0791 },
  Multan: { lat: 30.1575, lng: 71.5249 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
  Quetta: { lat: 30.1798, lng: 66.975 },
  Sialkot: { lat: 32.4945, lng: 74.5229 },
  Gujranwala: { lat: 32.1877, lng: 74.1945 },
};

// Default to Lahore when a store's city isn't in the map.
const FALLBACK = CITY_COORDS.Lahore!;

/** ±~5km random offset so shops in the same city don't share one pin. */
const jitter = () => (Math.random() - 0.5) * 0.09;

async function backfill() {
  await connectDB();

  const stores = await Store.find({
    $or: [{ lat: { $exists: false } }, { lat: null }, { lng: { $exists: false } }, { lng: null }],
  });

  if (stores.length === 0) {
    console.log("All stores already have coordinates. Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Backfilling coordinates for ${stores.length} store(s)…`);
  for (const store of stores) {
    const base = CITY_COORDS[store.city] ?? FALLBACK;
    store.lat = Number((base.lat + jitter()).toFixed(6));
    store.lng = Number((base.lng + jitter()).toFixed(6));
    await store.save();
    console.log(`  ✓ ${store.name} (${store.city}) → ${store.lat}, ${store.lng}`);
  }

  console.log("Done. 'Near me' will now sort these shops by distance.");
  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
