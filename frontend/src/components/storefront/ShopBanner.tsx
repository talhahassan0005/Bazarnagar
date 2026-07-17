import type { Store } from "@/lib/types";

/** Banner ad shown on the shop page for free (starter) plan stores. */
export function ShopBanner({ store }: { store: Store }) {
  if (store.planId !== "starter") return null;
  return (
    <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-y border-amber-200 py-3 px-4 text-center text-sm text-amber-800">
      <span className="font-medium">Sponsored</span>
      {" · "}
      Discover more shops on{" "}
      <a href="/shops" className="font-semibold underline hover:text-amber-900">
        Bazaarnagar
      </a>
    </div>
  );
}
