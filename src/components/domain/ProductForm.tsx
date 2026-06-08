"use client";

import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
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
import { CATEGORIES } from "@/lib/constants";
import type { Plan, Product } from "@/lib/types";

export type ProductFormValues = Omit<
  Product,
  "id" | "storeId" | "moderationStatus" | "views" | "whatsappClicks" | "createdAt"
>;

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
  condition: "new",
  deliveryAvailable: false,
};

/**
 * Add/edit product form (SRS §5.4). Enforces the plan's image and video
 * limits (SRS §6) directly in the UI.
 */
export function ProductForm({
  initial,
  plan,
  submitLabel = "Save product",
  onSubmit,
}: {
  initial?: Product;
  plan: Plan;
  submitLabel?: string;
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
            <div key={i} className="flex items-end gap-2">
              <Input
                className="flex-1"
                label={i === 0 ? "Image URLs" : undefined}
                required={i === 0}
                value={url}
                placeholder="https://… (image URL)"
                onChange={(e) => setImage(i, e.target.value)}
              />
              {v.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="mb-0.5 rounded-lg border border-slate-200 p-2.5 text-slate-400 hover:bg-slate-50 hover:text-red-500"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
          {canAddImage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addImage}
              leftIcon={<ImagePlus className="h-4 w-4" />}
            >
              Add image ({v.images.length}/{plan.imageLimit})
            </Button>
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
              { value: "out_of_stock", label: "Out of stock" },
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
          <Select
            label="Condition"
            value={v.condition ?? "new"}
            onChange={(e) => set("condition", e.target.value as ProductFormValues["condition"])}
            options={[
              { value: "new", label: "New" },
              { value: "used", label: "Used" },
            ]}
          />
          <div className="space-y-4 sm:pt-7">
            <Toggle
              label="Negotiable"
              checked={v.negotiable}
              onChange={(val) => set("negotiable", val)}
            />
            <Toggle
              label="Delivery available"
              checked={!!v.deliveryAvailable}
              onChange={(val) => set("deliveryAvailable", val)}
            />
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-3">
        <Button href="/dashboard/products" variant="outline">
          Cancel
        </Button>
        <Button type="submit" size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
