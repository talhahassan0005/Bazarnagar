"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Product image with a graceful fallback. If the image is missing or fails to
 * load (e.g. a flaky external host), it shows a branded gradient tile instead
 * of a broken/gray box — so cards always look intentional.
 */
export function ProductImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-200",
          className
        )}
      >
        <ShoppingBag className="h-1/4 w-1/4 text-brand-300" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
