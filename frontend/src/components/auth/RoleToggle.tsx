import { ShoppingBag, Store } from "lucide-react";

export type AuthRole = "customer" | "seller";

/** Buyer / Seller segmented toggle — decides which account type to log into or create. */
export function RoleToggle({ role, onChange }: { role: AuthRole; onChange: (role: AuthRole) => void }) {
  const isSeller = role === "seller";
  return (
    <div className="relative grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-semibold">
      <div
        className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-xl bg-white shadow-sm transition-transform duration-200 ease-out"
        style={{ transform: isSeller ? "translateX(calc(100% + 0.5rem))" : "translateX(0)" }}
        aria-hidden
      />
      {(["customer", "seller"] as const).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition-colors ${
            role === r ? "text-brand-700" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {r === "customer" ? <ShoppingBag className="h-4 w-4" /> : <Store className="h-4 w-4" />}
          {r === "customer" ? "I'm a buyer" : "I'm a seller"}
        </button>
      ))}
    </div>
  );
}
