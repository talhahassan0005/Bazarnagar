import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { ApiError } from "../lib/helpers";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

// Ensure the upload directory exists at startup.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 }, // 5 MB each, max 8 files
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, "Only JPEG, PNG, WEBP or GIF images are allowed"));
  },
});
