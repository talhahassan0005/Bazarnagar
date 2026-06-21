import type { Request, Response } from "express";
import { env } from "../config/env";
import { ApiError, asyncHandler } from "../lib/helpers";

/** Build an absolute, publicly reachable URL for an uploaded file. */
function fileUrl(filename: string): string {
  return `${env.publicUrl.replace(/\/$/, "")}/uploads/${filename}`;
}

/** POST /api/upload — single image (field name: "image"). */
export const uploadSingle = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, "No image uploaded (use field name 'image')");
  res.status(201).json({ url: fileUrl(req.file.filename) });
});

/** POST /api/upload/multiple — up to 8 images (field name: "images"). */
export const uploadMultiple = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw new ApiError(400, "No images uploaded (use field name 'images')");
  res.status(201).json({ urls: files.map((f) => fileUrl(f.filename)) });
});
