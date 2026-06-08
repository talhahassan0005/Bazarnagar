import { MapPin, MessageCircle, TrendingUp } from "lucide-react";
import { BrandMark } from "@/components/layout/Logo";

const PRODUCTS = [
  { seed: "kurti-1", name: "Embroidered Kurti", price: "Rs. 1,999", was: "Rs. 2,500", tag: "20% OFF" },
  { seed: "lawn-1", name: "Lawn 3-Piece", price: "Rs. 4,500", was: null, tag: null },
  { seed: "lipstick-1", name: "Lipstick Set", price: "Rs. 1,199", was: "Rs. 1,500", tag: "Sale" },
  { seed: "earbuds-1", name: "Wireless Earbuds", price: "Rs. 2,799", was: null, tag: "New" },
];

/** Stylized storefront preview shown in the landing hero. */
export function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Browser-style storefront card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-brand-900/15 ring-1 ring-black/5 [transform:perspective(1200px)_rotateY(-6deg)_rotateX(2deg)]">
        {/* Browser bar */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <div className="ml-3 flex-1 truncate rounded-md bg-slate-100 px-3 py-1 text-[11px] text-slate-400">
            bazaarnagar.com/store/ayesha-boutique
          </div>
        </div>

        {/* Cover */}
        <div className="h-16 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800" />

        {/* Shop header */}
        <div className="px-4">
          <div className="-mt-6 flex items-end gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border-4 border-white bg-white shadow-sm">
              <BrandMark className="h-8 w-8" />
            </span>
            <div className="flex-1 pb-1">
              <p className="text-sm font-bold text-slate-900">Ayesha Boutique</p>
              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="h-3 w-3" /> Gulberg, Lahore
              </p>
            </div>
            <span className="mb-1 flex items-center gap-1 rounded-lg bg-whatsapp px-2 py-1 text-[11px] font-medium text-white">
              <MessageCircle className="h-3 w-3" /> Chat
            </span>
          </div>

          {/* Product grid */}
          <div className="my-4 grid grid-cols-2 gap-2.5">
            {PRODUCTS.map((p) => (
              <div key={p.seed} className="overflow-hidden rounded-xl border border-slate-100">
                <div className="relative aspect-square bg-slate-100">
                  <img
                    src={`https://picsum.photos/seed/${p.seed}/240/240`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {p.tag && (
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-accent-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      {p.tag}
                    </span>
                  )}
                </div>
                <div className="p-1.5">
                  <p className="truncate text-[11px] font-medium text-slate-700">{p.name}</p>
                  <p className="text-[11px] font-bold text-slate-900">
                    {p.price}
                    {p.was && (
                      <span className="ml-1 font-normal text-slate-400 line-through">{p.was}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating accent cards */}
      <div className="animate-float absolute -left-5 top-28 hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-xl sm:block">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-whatsapp/15 text-whatsapp">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-900">New inquiry</p>
            <p className="text-[11px] text-slate-400">via WhatsApp</p>
          </div>
        </div>
      </div>

      <div className="animate-float-slow absolute -right-4 bottom-6 hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-xl sm:block">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-50 text-accent-600">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-900">420 views</p>
            <p className="text-[11px] text-leaf-600">+18% this week</p>
          </div>
        </div>
      </div>
    </div>
  );
}
