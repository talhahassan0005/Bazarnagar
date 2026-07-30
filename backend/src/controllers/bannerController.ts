import type { Request, Response } from "express";
import { z } from "zod";
import { Banner } from "../models/Banner";
import { ApiError, asyncHandler } from "../lib/helpers";

/**
 * GET /api/public/banners — active banner ads, for free-plan shop pages.
 * Optional ?category= narrows to banners targeting that store category
 * (case-insensitive) plus untargeted ("all categories") banners.
 */
export const getActiveBanners = asyncHandler(async (req: Request, res: Response) => {
  const category = (req.query.category as string | undefined)?.trim();
  const all = await Banner.find({ active: true }).sort({ order: 1, createdAt: -1 });

  if (!category) {
    return res.json(all.map((b) => b.toJSON()));
  }
  const relevant = all.filter(
    (b) => !b.category || b.category.trim().toLowerCase() === category.toLowerCase()
  );
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
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

/** POST /api/admin/banners — create a banner ad. */
export const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const data = bannerSchema.parse(req.body);
  const banner = await Banner.create({
    ...data,
    active: data.active ?? true,
    order: data.order ?? 0,
  });
  res.status(201).json(banner.toJSON());
});

const updateBannerSchema = bannerSchema.partial();

/** PATCH /api/admin/banners/:id — update a banner ad. */
export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
  const data = updateBannerSchema.parse(req.body);
  const banner = await Banner.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!banner) throw new ApiError(404, "Banner not found");
  res.json(banner.toJSON());
});

/** DELETE /api/admin/banners/:id — remove a banner ad. */
export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw new ApiError(404, "Banner not found");
  res.json({ ok: true });
});
