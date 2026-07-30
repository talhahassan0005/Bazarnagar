import { Router } from "express";
import { upload } from "../middleware/upload";
import { uploadSingle, uploadMultiple } from "../controllers/uploadController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// Authenticated sellers (product/store images) and admins (banner ads).
router.use(authenticate, requireRole("seller", "admin"));

router.post("/", upload.single("image"), uploadSingle);
router.post("/multiple", upload.array("images", 8), uploadMultiple);

export default router;
