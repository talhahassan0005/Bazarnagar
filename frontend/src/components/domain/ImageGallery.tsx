"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

/** Product image gallery with a main image and selectable thumbnails. */
export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(false);

  if (!images.length || failed) {
    return (
      <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-slate-200 flex items-center justify-center">
        <ShoppingBag className="h-1/4 w-1/4 text-brand-300" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <img
          src={images[active]}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition",
                active === i ? "border-brand-500" : "border-transparent opacity-70"
              )}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
