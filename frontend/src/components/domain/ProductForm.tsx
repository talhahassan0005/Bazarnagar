"use client";

import { useState } from "react";
import Link from "next/link";
import { ImagePlus, Navigation, Plus, Trash2, X } from "lucide-react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  Textarea,
  Toggle,
} from "@/components/ui";
import { ImageUpload } from "./ImageUpload";
import { CATEGORIES } from "@/lib/constants";
import type { Plan, Product } from "@/lib/types";

export type ProductFormValues = Omit<
  Product,
  "id" | "storeId" | "moderationStatus" | "views" | "whatsappClicks" | "addToCartClicks" | "buyNowClicks" | "createdAt"
>;

type VariantOption = { label: string; price: number; discountPrice?: number };
type Variant = { name: string; options: VariantOption[] };

const EMPTY: ProductFormValues = {
  name: "",
  category: "",
  price: 0,
  discountPrice: undefined,
  images: [""],
  videoUrl: "",
  description: "",
  tags: [],
  stockStatus: "in_stock",
  status: "active",
  negotiable: false,
  brand: undefined,
  condition: undefined,
  variants: [],
  deliveryOption: "available",
  deliveryFee: undefined,
};

/**
 * Add/edit product form (SRS §5.4). Enforces the plan's image and video
 * limits (SRS §6) directly in the UI.
 */
// ---------------------------------------------------------------------------
// Variants editor
// ---------------------------------------------------------------------------
function VariantsEditor({
  variants,
  onChange,
}: {
  variants: Variant[];
  onChange: (v: Variant[]) => void;
}) {
  function addGroup() {
    onChange([...variants, { name: "", options: [{ label: "", price: 0 }] }]);
  }
  function removeGroup(gi: number) {
    onChange(variants.filter((_, i) => i !== gi));
  }
  function setGroupName(gi: number, name: string) {
    onChange(variants.map((g, i) => (i === gi ? { ...g, name } : g)));
  }
  function addOption(gi: number) {
    onChange(
      variants.map((g, i) =>
        i === gi ? { ...g, options: [...g.options, { label: "", price: 0 }] } : g
      )
    );
  }
  function removeOption(gi: number, oi: number) {
    onChange(
      variants.map((g, i) =>
        i === gi ? { ...g, options: g.options.filter((_, j) => j !== oi) } : g
      )
    );
  }
  function setOption(gi: number, oi: number, field: keyof VariantOption, val: string) {
    onChange(
      variants.map((g, i) =>
        i === gi
          ? {
              ...g,
              options: g.options.map((o, j) =>
                j === oi
                  ? {
                      ...o,
                      [field]: field === "label"
                        ? val
                        : val === "" ? undefined : Number(val),
                    }
                  : o
              ),
            }
          : g
      )
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Variants (optional)</span>
        <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={addGroup}>
          Add variant group
        </Button>
      </div>
      {variants.length === 0 && (
        <p className="text-xs text-slate-400">
          Add variant groups like &quot;Size&quot; or &quot;Color&quot; — each with its own price.
        </p>
      )}
      {variants.map((group, gi) => (
        <div key={gi} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              label="Group name"
              placeholder="e.g. Size, Color, Material"
              value={group.name}
              onChange={(e) => setGroupName(gi, e.target.value)}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => removeGroup(gi)}
              className="mt-6 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {group.options.map((opt, oi) => (
              <div key={oi} className="flex items-end gap-2">
                <Input
                  label={oi === 0 ? "Option" : undefined}
                  placeholder="e.g. Large"
                  value={opt.label}
                  onChange={(e) => setOption(gi, oi, "label", e.target.value)}
                  className="flex-1"
                />
                <Input
                  label={oi === 0 ? "Price (Rs.)" : undefined}
                  type="number"
                  min={0}
                  placeholder="0"
                  value={!opt.price ? "" : opt.price}
                  onChange={(e) => setOption(gi, oi, "price", e.target.value)}
                  className="w-28"
                />
                <Input
                  label={oi === 0 ? "Discount (Rs.)" : undefined}
                  type="number"
                  min={0}
                  placeholder="Optional"
                  value={opt.discountPrice ?? ""}
                  onChange={(e) => setOption(gi, oi, "discountPrice", e.target.value)}
                  className="w-28"
                />
                {group.options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOption(gi, oi)}
                    className={`shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 ${oi === 0 ? "mb-0" : ""}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => addOption(gi)}
          >
            Add option
          </Button>
        </div>
      ))}
    </div>
  );
}

export function ProductForm({
  initial,
  plan,
  submitLabel = "Save product",
  loading,
  onSubmit,
}: {
  initial?: Product;
  plan: Plan;
  submitLabel?: string;
  loading?: boolean;
  onSubmit?: (values: ProductFormValues) => void;
}) {
  const [v, setV] = useState<ProductFormValues>({
    ...EMPTY,
    ...initial,
    images: initial?.images.length ? initial.images : [""],
  });
  const [tagInput, setTagInput] = useState(initial?.tags.join(", ") ?? "");

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const [locating, setLocating] = useState(false);
  function captureLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setV((prev) => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const setImage = (i: number, url: string) =>
    setV((prev) => ({ ...prev, images: prev.images.map((im, idx) => (idx === i ? url : im)) }));
  const addImage = () =>
    setV((prev) => ({ ...prev, images: [...prev.images, ""] }));
  const removeImage = (i: number) =>
    setV((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit?.({
      ...v,
      images: v.images.filter(Boolean),
      tags: tagInput.split(",").map((t) => t.trim()).filter(Boolean),
    });
  }

  const canAddImage = v.images.length < plan.imageLimit;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader title="Product details" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label="Product name"
            required
            value={v.name}
            placeholder="Black Embroidered Kurti"
            onChange={(e) => set("name", e.target.value)}
          />
          <Select
            label="Category"
            required
            placeholder="Select a category"
            value={v.category}
            onChange={(e) => set("category", e.target.value)}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Input
            label="Price (Rs.)"
            required
            type="number"
            min={0}
            value={v.price || ""}
            placeholder="2500"
            onChange={(e) => set("price", Number(e.target.value))}
          />
          <Input
            label="Discount price (Rs.)"
            type="number"
            min={0}
            value={v.discountPrice ?? ""}
            placeholder="Optional sale price"
            onChange={(e) =>
              set("discountPrice", e.target.value ? Number(e.target.value) : undefined)
            }
          />
          <Input
            label="Tags"
            value={tagInput}
            placeholder="kurti, embroidered, lawn"
            hint="Comma-separated search keywords."
            onChange={(e) => setTagInput(e.target.value)}
          />
          <Textarea
            className="sm:col-span-2"
            label="Description"
            value={v.description ?? ""}
            placeholder="Short product detail."
            onChange={(e) => set("description", e.target.value)}
          />
        </CardBody>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader
          title="Images & video"
          subtitle={`${plan.name} plan: up to ${plan.imageLimit} image${
            plan.imageLimit > 1 ? "s" : ""
          }${plan.videoLimit > 0 ? ` and ${plan.videoLimit} video` : " · no video"} per product.`}
        />
        <CardBody className="space-y-3">
          {v.images.map((url, i) => (
            <div key={i} className="flex items-start gap-2">
              <ImageUpload
                className="flex-1"
                label={i === 0 ? "Product images" : undefined}
                required={i === 0}
                value={url}
                onChange={(u) => setImage(i, u)}
              />
              {v.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="mt-0.5 rounded-lg border border-slate-200 p-2.5 text-slate-400 hover:bg-slate-50 hover:text-red-500"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
          {canAddImage ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addImage}
              leftIcon={<ImagePlus className="h-4 w-4" />}
            >
              Add image ({v.images.length}/{plan.imageLimit})
            </Button>
          ) : (
            <p className="text-xs text-slate-500">
              You've reached your {plan.name} plan's limit of {plan.imageLimit} image
              {plan.imageLimit > 1 ? "s" : ""} per product.{" "}
              <Link href="/dashboard/plan" className="font-medium text-brand-700 hover:underline">
                Upgrade for more →
              </Link>
            </p>
          )}
          {plan.videoLimit > 0 && (
            <Input
              label="Video link"
              value={v.videoUrl ?? ""}
              placeholder="https://youtube.com/…"
              onChange={(e) => set("videoUrl", e.target.value)}
            />
          )}
        </CardBody>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader title="Availability & settings" />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Stock status"
            required
            value={v.stockStatus}
            onChange={(e) => set("stockStatus", e.target.value as ProductFormValues["stockStatus"])}
            options={[
              { value: "in_stock", label: "In stock" },
              { value: "out_of_stock", label: "Sold out" },
            ]}
          />
          <Select
            label="Product status"
            required
            value={v.status}
            onChange={(e) => set("status", e.target.value as ProductFormValues["status"])}
            options={[
              { value: "active", label: "Active (visible)" },
              { value: "inactive", label: "Inactive (hidden)" },
            ]}
          />
          <Input
            label="Brand (optional)"
            placeholder="e.g. Nike, Samsung, Unbranded"
            value={v.brand ?? ""}
            onChange={(e) => set("brand", e.target.value || undefined)}
          />
          <Select
            label="Condition tag (optional)"
            value={v.condition ?? ""}
            onChange={(e) =>
              set("condition", (e.target.value || null) as ProductFormValues["condition"])
            }
            options={[
              { value: "", label: "Don't show a tag" },
              { value: "new", label: "Brand new" },
              { value: "used", label: "Second hand" },
            ]}
          />
          <div className="sm:col-span-2">
            <VariantsEditor
              variants={(v.variants ?? []) as Variant[]}
              onChange={(variants) => set("variants", variants)}
            />
          </div>
          <div className="space-y-4 sm:pt-7">
            <Toggle
              label="Negotiable"
              checked={v.negotiable}
              onChange={(val) => set("negotiable", val)}
            />
          </div>

          <Select
            label="Delivery"
            value={v.deliveryOption}
            onChange={(e) => set("deliveryOption", e.target.value as ProductFormValues["deliveryOption"])}
            options={[
              { value: "available", label: "Available" },
              { value: "not_available", label: "No delivery (WhatsApp only, no online orders)" },
              { value: "negotiable", label: "Negotiable" },
            ]}
          />
          {v.deliveryOption === "available" && (
            <Input
              label="Delivery fee (Rs.)"
              type="number"
              min={0}
              placeholder="0 = free delivery"
              value={v.deliveryFee ?? ""}
              onChange={(e) => set("deliveryFee", e.target.value ? Number(e.target.value) : undefined)}
            />
          )}

          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={locating}
              leftIcon={<Navigation className="h-4 w-4" />}
              onClick={captureLocation}
            >
              Use my current location (optional)
            </Button>
            {v.lat != null && v.lng != null && (
              <span className="ml-3 text-xs font-medium text-leaf-600">
                Pinned ({v.lat.toFixed(3)}, {v.lng.toFixed(3)}) — helps nearby shoppers find it.
              </span>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Leave blank to use your store&apos;s location.
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-3">
        <Button href="/dashboard/products" variant="outline">
          Cancel
        </Button>
        <Button type="submit" size="lg" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
