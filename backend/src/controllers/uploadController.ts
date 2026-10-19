import type { Request, Response } from "express";
import { ApiError, asyncHandler } from "../lib/helpers";
import { saveImage } from "../lib/storage";
import { UploadLog } from "../models/UploadLog";

/**
 * Save one file and record it for per-store storage tracking. A failed log
 * write never fails the upload — the image is already stored.
 */
async function storeAndLog(req: Request, file: Express.Multer.File): Promise<string> {
  const saved = await saveImage(file);
  const isSeller = req.user?.role === "seller";
  try {
    await UploadLog.create({
      key: saved.key,
      url: saved.url,
      size: file.size,
      contentType: file.mimetype,
      storage: saved.storage,
      uploaderRole: isSeller ? "seller" : "admin",
      sellerId: isSeller ? req.user!.id : undefined,
    });
  } catch (err) {
    console.error("Failed to log upload:", err);
  }
  return saved.url;
}

/** POST /api/upload — single image (field name: "image"). */
export const uploadSingle = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, "No image uploaded (use field name 'image')");
  res.status(201).json({ url: await storeAndLog(req, req.file) });
});

/** POST /api/upload/multiple — up to 8 images (field name: "images"). */
export const uploadMultiple = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw new ApiError(400, "No images uploaded (use field name 'images')");
  res.status(201).json({ urls: await Promise.all(files.map((f) => storeAndLog(req, f))) });
});
