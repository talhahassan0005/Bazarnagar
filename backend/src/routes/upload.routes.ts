import { Router } from "express";
import { upload } from "../middleware/upload";
import { uploadSingle, uploadMultiple } from "../controllers/uploadController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// Only authenticated sellers can upload product/store images.
router.use(authenticate, requireRole("seller"));

router.post("/", upload.single("image"), uploadSingle);
router.post("/multiple", upload.array("images", 8), uploadMultiple);

export default router;
