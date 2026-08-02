export type AuthRole = "customer" | "seller";

/** Buyer / Seller segmented toggle — decides which account type to log into or create. */
export function RoleToggle({ role, onChange }: { role: AuthRole; onChange: (role: AuthRole) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium">
      {(["customer", "seller"] as const).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={`rounded-lg py-2 transition-colors ${
            role === r ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {r === "customer" ? "I'm a buyer" : "I'm a seller"}
        </button>
      ))}
    </div>
  );
}
