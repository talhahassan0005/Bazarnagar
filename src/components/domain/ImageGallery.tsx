"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Product image gallery with a main image and selectable thumbnails. */
export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const safe = images.length ? images : ["https://picsum.photos/seed/empty/800/800"];

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <img src={safe[active]} alt={alt} className="h-full w-full object-cover" />
      </div>
      {safe.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {safe.map((img, i) => (
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
