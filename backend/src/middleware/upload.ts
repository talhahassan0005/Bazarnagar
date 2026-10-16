import multer from "multer";
import { ApiError } from "../lib/helpers";

// Kept for the static /uploads route, which still serves images saved before
// the move to R2 (and new ones when R2 isn't configured).
export { UPLOAD_DIR } from "../lib/storage";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Files are held in memory; the controller decides where they're stored.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 }, // 5 MB each, max 8 files
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, "Only JPEG, PNG, WEBP or GIF images are allowed"));
  },
});
