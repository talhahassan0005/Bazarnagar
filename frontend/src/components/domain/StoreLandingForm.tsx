"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  Textarea,
  Toggle,
} from "@/components/ui";
import { THEME_OPTIONS, defaultLanding } from "@/lib/landing";
import { cn, formatPrice } from "@/lib/utils";
import type { Product, StoreLanding, StoreTheme } from "@/lib/types";

/**
 * Seller-facing editor for the customizable store landing page.
 * Self-contained & controlled — `onSubmit` receives the assembled config.
 */
export function StoreLandingForm({
  initial,
  products,
  saving,
  onSubmit,
}: {
  initial?: StoreLanding;
  products: Product[];
  saving?: boolean;
  onSubmit?: (values: StoreLanding) => void;
}) {
  const [v, setV] = useState<StoreLanding>({ ...defaultLanding(), ...initial });
  const set = <K extends keyof StoreLanding>(key: K, value: StoreLanding[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const toggleFeatured = (id: string) =>
    setV((prev) => ({
      ...prev,
      featuredProductIds: prev.featuredProductIds.includes(id)
        ? prev.featuredProductIds.filter((p) => p !== id)
        : [...prev.featuredProductIds, id],
    }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit?.(v);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Page + theme */}
      <Card>
        <CardHeader
          title="Landing page"
          subtitle="A branded welcome page customers see at your store link."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Toggle
              label="Use a custom landing page"
              description="When off, your store link opens the product catalog directly."
              checked={v.enabled}
              onChange={(val) => set("enabled", val)}
            />
          </div>
          <Select
            label="Colour theme"
            value={v.theme}
            onChange={(e) => set("theme", e.target.value as StoreTheme)}
            options={THEME_OPTIONS}
          />
        </CardBody>
      </Card>

      {/* Hero */}
      <Card>
        <CardHeader title="Hero section" subtitle="The first thing visitors see." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label="Headline"
            value={v.headline ?? ""}
            placeholder="Effortless eastern wear, delivered to your door"
            hint="Leave blank to use your store name."
            onChange={(e) => set("headline", e.target.value)}
          />
          <Textarea
            className="sm:col-span-2"
            label="Tagline"
            value={v.tagline ?? ""}
            placeholder="A short line about what you sell."
            hint="Leave blank to use your store description."
            onChange={(e) => set("tagline", e.target.value)}
          />
          <Input
            label="Hero image URL"
            value={v.heroImageUrl ?? ""}
            placeholder="https://…"
            hint="Leave blank to use your cover image."
            onChange={(e) => set("heroImageUrl", e.target.value)}
          />
          <Input
            label="Button label"
            value={v.primaryCtaLabel ?? ""}
            placeholder="Browse products"
            onChange={(e) => set("primaryCtaLabel", e.target.value)}
          />
        </CardBody>
      </Card>

      {/* Featured products */}
      <Card>
        <CardHeader
          title="Featured products"
          subtitle="Showcase a few products at the top of your landing page."
        />
        <CardBody className="space-y-4">
          <Toggle
            label="Show featured products"
            checked={v.showFeatured}
            onChange={(val) => set("showFeatured", val)}
          />
          {v.showFeatured &&
            (products.length === 0 ? (
              <p className="text-sm text-slate-500">
                Add products first — they’ll appear here to feature.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {products.map((p) => {
                  const selected = v.featuredProductIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleFeatured(p.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-2 text-left transition",
                        selected
                          ? "border-brand-300 bg-brand-50"
                          : "border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <img
                        src={p.images[0]}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {p.name}
                        </span>
                        <span className="text-xs text-slate-500">{formatPrice(p.price)}</span>
                      </span>
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          selected
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-300"
                        )}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
        </CardBody>
      </Card>

      {/* About */}
      <Card>
        <CardHeader title="About section" subtitle="Tell customers why they should buy from you." />
        <CardBody className="grid gap-4">
          <Toggle
            label="Show about section"
            checked={v.showAbout}
            onChange={(val) => set("showAbout", val)}
          />
          {v.showAbout && (
            <>
              <Input
                label="About title"
                value={v.aboutTitle ?? ""}
                placeholder="Why shop with us"
                onChange={(e) => set("aboutTitle", e.target.value)}
              />
              <Textarea
                label="About text"
                value={v.aboutText ?? ""}
                placeholder="A paragraph about your shop, quality, and service."
                onChange={(e) => set("aboutText", e.target.value)}
              />
            </>
          )}
        </CardBody>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader title="Contact section" subtitle="WhatsApp, location and socials." />
        <CardBody>
          <Toggle
            label="Show contact section"
            description="Pulls from your store profile (WhatsApp, location, socials)."
            checked={v.showContact}
            onChange={(val) => set("showContact", val)}
          />
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Saving…" : "Save landing page"}
        </Button>
      </div>
    </form>
  );
}
