import type { Request, Response } from "express";
import { z } from "zod";
import { Banner } from "../models/Banner";
import { ApiError, asyncHandler } from "../lib/helpers";

/**
 * GET /api/public/banners — active banner ads, for free-plan shop pages.
 * Optional ?category= narrows to banners targeting that store category
 * (case-insensitive) plus untargeted ("all categories") banners.
 * Optional ?placement= (top|bottom|sidebar) narrows to banners assigned to
 * that slot plus unassigned ("any slot") banners.
 */
export const getActiveBanners = asyncHandler(async (req: Request, res: Response) => {
  const category = (req.query.category as string | undefined)?.trim();
  const placement = (req.query.placement as string | undefined)?.trim();
  const all = await Banner.find({ active: true }).sort({ order: 1, createdAt: -1 });

  const relevant = all.filter((b) => {
    const categoryOk = !category || !b.category || b.category.trim().toLowerCase() === category.toLowerCase();
    const placementOk = !placement || !b.placement || b.placement === placement;
    return categoryOk && placementOk;
  });
  res.json(relevant.map((b) => b.toJSON()));
});

/** GET /api/admin/banners — all banner ads (active + inactive). */
export const getAllBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
  res.json(banners.map((b) => b.toJSON()));
});

const bannerSchema = z.object({
  title: z.string().trim().optional(),
  imageUrl: z.string().min(1, "Image is required"),
  linkUrl: z.string().trim().optional(),
  category: z.string().trim().optional(),
  // "" (from the admin form's "Anywhere" option) clears the field.
  placement: z.enum(["top", "bottom", "sidebar"]).optional().or(z.literal("")),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

/** POST /api/admin/banners — create a banner ad. */
export const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const data = bannerSchema.parse(req.body);
  const banner = await Banner.create({
    ...data,
    placement: data.placement || undefined,
    active: data.active ?? true,
    order: data.order ?? 0,
  });
  res.status(201).json(banner.toJSON());
});

const updateBannerSchema = bannerSchema.partial();

/** PATCH /api/admin/banners/:id — update a banner ad. */
export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
  const { placement, ...data } = updateBannerSchema.parse(req.body);
  const update: Record<string, unknown> = { ...data };
  if (placement !== undefined) {
    if (placement === "") update.$unset = { placement: "" };
    else update.placement = placement;
  }
  const banner = await Banner.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!banner) throw new ApiError(404, "Banner not found");
  res.json(banner.toJSON());
});

/** DELETE /api/admin/banners/:id — remove a banner ad. */
export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw new ApiError(404, "Banner not found");
  res.json({ ok: true });
});
