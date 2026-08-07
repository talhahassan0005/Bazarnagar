import type { Request, Response } from "express";
import { z } from "zod";
import { AdSettings } from "../models/AdSettings";
import { asyncHandler } from "../lib/helpers";

const DEFAULTS = {
  adsenseEnabled: false,
  adsensePublisherId: "",
  placements: {
    top: { source: "manual" as const },
    bottom: { source: "manual" as const },
    sidebar: { source: "manual" as const },
  },
};

/** GET /api/public/ad-settings — which ad source (manual banner / AdSense / off) each slot uses. */
export const getAdSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await AdSettings.findOne({ key: "ad-settings" });
  res.json(settings?.toJSON() ?? DEFAULTS);
});

const placementSchema = z.object({
  source: z.enum(["manual", "adsense", "off"]),
  adsenseSlotId: z.string().trim().optional(),
});

const updateSchema = z.object({
  adsenseEnabled: z.boolean().optional(),
  adsensePublisherId: z.string().trim().optional(),
  placements: z
    .object({
      top: placementSchema.optional(),
      bottom: placementSchema.optional(),
      sidebar: placementSchema.optional(),
    })
    .optional(),
});

/** PATCH /api/admin/ad-settings — update which slots use manual banners vs AdSense. */
export const updateAdSettings = asyncHandler(async (req: Request, res: Response) => {
  const data = updateSchema.parse(req.body);
  const existing = await AdSettings.findOne({ key: "ad-settings" });

  const settings = await AdSettings.findOneAndUpdate(
    { key: "ad-settings" },
    {
      $set: {
        ...(data.adsenseEnabled !== undefined ? { adsenseEnabled: data.adsenseEnabled } : {}),
        ...(data.adsensePublisherId !== undefined ? { adsensePublisherId: data.adsensePublisherId } : {}),
        placements: {
          top: data.placements?.top ?? existing?.placements?.top ?? DEFAULTS.placements.top,
          bottom: data.placements?.bottom ?? existing?.placements?.bottom ?? DEFAULTS.placements.bottom,
          sidebar: data.placements?.sidebar ?? existing?.placements?.sidebar ?? DEFAULTS.placements.sidebar,
        },
      },
    },
    { upsert: true, new: true }
  );
  res.json(settings.toJSON());
});
