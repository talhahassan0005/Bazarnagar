"use client";

import { useState } from "react";
import { Button, Input, Modal, Select, Toggle } from "@/components/ui";
import { ImageUpload } from "@/components/domain/ImageUpload";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useCreateBannerMutation, useUpdateBannerMutation } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";
import type { Banner, BannerPlacement } from "@/lib/types";

const PLACEMENT_OPTIONS: { value: BannerPlacement | ""; label: string }[] = [
  { value: "", label: "Anywhere (top, bottom or sidebar)" },
  { value: "top", label: "Top banner only" },
  { value: "bottom", label: "Bottom banner only" },
  { value: "sidebar", label: "Vertical sidebar card only" },
];

/** Admin modal to create or edit a banner ad. */
export function BannerFormModal({
  banner,
  onClose,
}: {
  /** Omit to create a new banner. */
  banner?: Banner;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const [createBanner, { isLoading: creating }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: updating }] = useUpdateBannerMutation();
  const saving = creating || updating;

  const [title, setTitle] = useState(banner?.title ?? "");
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? "");
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? "");
  const [category, setCategory] = useState(banner?.category ?? "");
  const [placement, setPlacement] = useState<BannerPlacement | "">(banner?.placement ?? "");
  const [order, setOrder] = useState(String(banner?.order ?? 0));
  const [active, setActive] = useState(banner?.active ?? true);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl) {
      setError("Upload a banner image before saving.");
      return;
    }
    setError("");
    const values = {
      title: title.trim() || undefined,
      imageUrl,
      linkUrl: linkUrl.trim() || undefined,
      category: category.trim() || undefined,
      placement: placement || "",
      order: Number(order) || 0,
      active,
    };
    try {
      if (banner) {
        await updateBanner({ id: banner.id, values }).unwrap();
        dispatch(addToast("Banner updated", "success"));
      } else {
        await createBanner(values).unwrap();
        dispatch(addToast("Banner created", "success"));
      }
      onClose();
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not save banner"), "error"));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={banner ? "Edit banner ad" : "Add banner ad"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button form="banner-form" type="submit" loading={saving}>
            {banner ? "Save changes" : "Create banner"}
          </Button>
        </>
      }
    >
      <form id="banner-form" onSubmit={onSubmit} className="space-y-4">
        <ImageUpload
          label="Banner image"
          required
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url);
            setError("");
          }}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}

        <Input
          label="Title"
          hint="Internal label — not shown to shoppers."
          placeholder="e.g. Ramadan sale promo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Link URL"
          hint="Where shoppers go when they tap the banner. Leave blank for no link."
          placeholder="https://…"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />
        <Input
          label="Category"
          hint="Only shown on shops in this category (e.g. Electronics). Leave blank to show on every shop."
          placeholder="e.g. Electronics"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Input
          label="Order"
          type="number"
          hint="Lower numbers show first when multiple banners are active."
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        />
        <Toggle
          label="Active"
          description="Only active banners are shown on shop pages."
          checked={active}
          onChange={setActive}
        />
      </form>
    </Modal>
  );
}
