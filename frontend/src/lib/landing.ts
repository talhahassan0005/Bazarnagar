import type { Store, StoreLanding, StoreTheme } from "./types";

/**
 * Landing-page helpers shared by the public storefront and the seller
 * dashboard customizer. Themes map to *literal* Tailwind class strings so the
 * JIT compiler can see them (dynamic concatenation would be purged).
 */

export interface ThemeTokens {
  /** Hero gradient overlay (sits over the cover image). */
  heroFrom: string;
  heroTo: string;
  /** Solid accent button. */
  cta: string;
  /** Accent text colour for headings / eyebrows. */
  accentText: string;
  /** Soft tinted surface (e.g. about section background). */
  soft: string;
  /** Pill / chip styling. */
  chip: string;
}

export const STORE_THEMES: Record<StoreTheme, ThemeTokens> = {
  brand: {
    heroFrom: "from-brand-700",
    heroTo: "to-brand-900",
    cta: "bg-brand-600 hover:bg-brand-700 text-white",
    accentText: "text-brand-700",
    soft: "bg-brand-50",
    chip: "bg-brand-50 text-brand-700",
  },
  emerald: {
    heroFrom: "from-emerald-600",
    heroTo: "to-emerald-900",
    cta: "bg-emerald-600 hover:bg-emerald-700 text-white",
    accentText: "text-emerald-700",
    soft: "bg-emerald-50",
    chip: "bg-emerald-50 text-emerald-700",
  },
  rose: {
    heroFrom: "from-rose-500",
    heroTo: "to-rose-800",
    cta: "bg-rose-600 hover:bg-rose-700 text-white",
    accentText: "text-rose-700",
    soft: "bg-rose-50",
    chip: "bg-rose-50 text-rose-700",
  },
  amber: {
    heroFrom: "from-amber-500",
    heroTo: "to-amber-800",
    cta: "bg-amber-500 hover:bg-amber-600 text-white",
    accentText: "text-amber-700",
    soft: "bg-amber-50",
    chip: "bg-amber-50 text-amber-800",
  },
  dark: {
    heroFrom: "from-slate-800",
    heroTo: "to-slate-950",
    cta: "bg-slate-900 hover:bg-slate-800 text-white",
    accentText: "text-slate-800",
    soft: "bg-slate-100",
    chip: "bg-slate-200 text-slate-800",
  },
};

/** Human-friendly labels for the theme picker in the dashboard. */
export const THEME_OPTIONS: { value: StoreTheme; label: string }[] = [
  { value: "brand", label: "Bazaarnagar Blue" },
  { value: "emerald", label: "Emerald" },
  { value: "rose", label: "Rose" },
  { value: "amber", label: "Amber" },
  { value: "dark", label: "Charcoal" },
];

/** A fresh, all-defaults config — used to seed the dashboard form. */
export function defaultLanding(): StoreLanding {
  return {
    enabled: true,
    theme: "brand",
    headline: "",
    tagline: "",
    heroImageUrl: "",
    primaryCtaLabel: "",
    showFeatured: true,
    featuredProductIds: [],
    showAbout: true,
    aboutTitle: "",
    aboutText: "",
    showContact: true,
  };
}

/** Every display field resolved to a concrete value. */
export interface ResolvedLanding {
  enabled: boolean;
  theme: StoreTheme;
  headline: string;
  tagline: string;
  heroImageUrl?: string;
  primaryCtaLabel: string;
  showFeatured: boolean;
  featuredProductIds: string[];
  showAbout: boolean;
  aboutTitle: string;
  aboutText: string;
  showContact: boolean;
}

/**
 * Fill in landing defaults from the store profile so even an un-configured
 * store gets a presentable page. A trimmed-empty saved value falls back too.
 */
export function resolveLanding(store: Store): ResolvedLanding {
  const l = store.landing;
  const pick = (value: string | undefined, fallback: string) => {
    const v = value?.trim();
    return v ? v : fallback;
  };

  return {
    enabled: l?.enabled ?? true,
    theme: l?.theme ?? "brand",
    headline: pick(l?.headline, store.name),
    tagline: pick(l?.tagline, store.description),
    heroImageUrl: l?.heroImageUrl?.trim() || store.coverUrl,
    primaryCtaLabel: pick(l?.primaryCtaLabel, "Browse products"),
    showFeatured: l?.showFeatured ?? true,
    featuredProductIds: l?.featuredProductIds ?? [],
    showAbout: l?.showAbout ?? true,
    aboutTitle: pick(l?.aboutTitle, `About ${store.name}`),
    aboutText: pick(l?.aboutText, store.description),
    showContact: l?.showContact ?? true,
  };
}
