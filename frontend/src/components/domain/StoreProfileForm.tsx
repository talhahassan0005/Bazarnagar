"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Select, Textarea, Toggle } from "@/components/ui";
import { ImageUpload } from "./ImageUpload";
import { CATEGORIES, CITIES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import type { Store } from "@/lib/types";

type StoreFormValues = Omit<Store, "id" | "sellerId" | "status" | "views" | "whatsappClicks">;

const EMPTY: StoreFormValues = {
  name: "",
  slug: "",
  description: "",
  category: "",
  whatsapp: "",
  city: "",
  area: "",
  fullAddress: "",
  mapsLink: "",
  showLocation: true,
  showInSearch: true,
  logoUrl: "",
  coverUrl: "",
  socials: { instagram: "", facebook: "", tiktok: "" },
  deliveryInfo: "",
  paymentInfo: "",
};

/**
 * Create/edit store profile (SRS §5.3). Controlled, self-contained form —
 * `onSubmit` receives the assembled values so it can call the API.
 */
export function StoreProfileForm({
  initial,
  loading,
  onSubmit,
}: {
  initial?: Store;
  loading?: boolean;
  onSubmit?: (values: StoreFormValues) => void;
}) {
  const [v, setV] = useState<StoreFormValues>({ ...EMPTY, ...initial });
  const set = <K extends keyof StoreFormValues>(key: K, value: StoreFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit?.(v);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basics */}
      <Card>
        <CardHeader title="Store basics" subtitle="The essentials customers see first." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Store name"
            required
            value={v.name}
            placeholder="Ayesha Boutique"
            onChange={(e) => {
              const name = e.target.value;
              setV((prev) => ({
                ...prev,
                name,
                // keep slug in sync until the seller edits it manually
                slug: prev.slug && prev.slug !== slugify(prev.name) ? prev.slug : slugify(name),
              }));
            }}
          />
          <Input
            label="Store link"
            required
            leftAddon="/store/"
            value={v.slug}
            placeholder="ayesha-boutique"
            onChange={(e) => set("slug", slugify(e.target.value))}
            hint="This becomes your public shop URL."
          />
          <Select
            label="Business category"
            required
            placeholder="Select a category"
            value={v.category}
            onChange={(e) => set("category", e.target.value)}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Input
            label="WhatsApp number"
            required
            type="tel"
            value={v.whatsapp}
            placeholder="0300-1234567"
            onChange={(e) => set("whatsapp", e.target.value)}
            hint="Used for all inquiry buttons."
          />
          <Textarea
            className="sm:col-span-2"
            label="Store description"
            required
            value={v.description}
            placeholder="Short intro about your shop and products."
            onChange={(e) => set("description", e.target.value)}
          />
        </CardBody>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader title="Branding" subtitle="Logo and cover image (optional)." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <ImageUpload
            label="Logo"
            value={v.logoUrl ?? ""}
            onChange={(u) => set("logoUrl", u)}
          />
          <ImageUpload
            label="Cover image"
            value={v.coverUrl ?? ""}
            onChange={(u) => set("coverUrl", u)}
          />
        </CardBody>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader title="Location" subtitle="Help nearby customers find you." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Select
            label="City"
            required
            placeholder="Select a city"
            value={v.city}
            onChange={(e) => set("city", e.target.value)}
            options={CITIES.map((c) => ({ value: c, label: c }))}
          />
          <Input
            label="Area"
            value={v.area ?? ""}
            placeholder="Gulberg"
            onChange={(e) => set("area", e.target.value)}
          />
          <Input
            className="sm:col-span-2"
            label="Full address"
            value={v.fullAddress ?? ""}
            placeholder="Main Boulevard, Gulberg III, Lahore"
            onChange={(e) => set("fullAddress", e.target.value)}
          />
          <Input
            className="sm:col-span-2"
            type="url"
            label="Google Maps link"
            value={v.mapsLink ?? ""}
            placeholder="https://maps.google.com/?q=…"
            hint="Must start with https:// (or leave blank)."
            onChange={(e) => set("mapsLink", e.target.value)}
          />
          <div className="sm:col-span-2">
            <Toggle
              label="Show location publicly"
              description="Display city/area and a Get Directions button on your shop."
              checked={v.showLocation}
              onChange={(val) => set("showLocation", val)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Social + extra info */}
      <Card>
        <CardHeader title="Social & policies" subtitle="Optional links and shop info." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Instagram"
            value={v.socials?.instagram ?? ""}
            placeholder="username"
            onChange={(e) => set("socials", { ...v.socials, instagram: e.target.value })}
          />
          <Input
            label="Facebook"
            value={v.socials?.facebook ?? ""}
            placeholder="page name"
            onChange={(e) => set("socials", { ...v.socials, facebook: e.target.value })}
          />
          <Input
            label="TikTok"
            value={v.socials?.tiktok ?? ""}
            placeholder="username"
            onChange={(e) => set("socials", { ...v.socials, tiktok: e.target.value })}
          />
          <Input
            label="Delivery information"
            value={v.deliveryInfo ?? ""}
            placeholder="Delivery across Pakistan"
            onChange={(e) => set("deliveryInfo", e.target.value)}
          />
          <Input
            label="Payment information"
            value={v.paymentInfo ?? ""}
            placeholder="COD / bank transfer"
            onChange={(e) => set("paymentInfo", e.target.value)}
          />
          <div className="sm:col-span-2">
            <Toggle
              label="Show my products in public search"
              description="If off, products only appear on your own shop page."
              checked={v.showInSearch}
              onChange={(val) => set("showInSearch", val)}
            />
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" size="lg" loading={loading}>
          Save store profile
        </Button>
      </div>
    </form>
  );
}
