import { cn } from "@/lib/utils";

/**
 * Embedded location map for a store. Uses Google Maps' keyless embed — prefers
 * exact coordinates (from "use my current location"), else the address/city.
 * Renders nothing when there's nothing to locate.
 */
export function StoreMap({
  lat,
  lng,
  query,
  className,
}: {
  lat?: number;
  lng?: number;
  query?: string;
  className?: string;
}) {
  const src =
    lat != null && lng != null
      ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
      : query && query.trim()
        ? `https://maps.google.com/maps?q=${encodeURIComponent(query.trim())}&z=14&output=embed`
        : null;

  if (!src) return null;

  return (
    <iframe
      src={src}
      title="Store location"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={cn("h-56 w-full rounded-xl border border-slate-200", className)}
    />
  );
}
