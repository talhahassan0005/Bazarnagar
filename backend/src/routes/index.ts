import { Router } from "express";
import authRoutes from "./auth.routes";
import publicRoutes from "./public.routes";
import sellerRoutes from "./seller.routes";
import adminRoutes from "./admin.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/seller", sellerRoutes);
router.use("/admin", adminRoutes);
router.use("/upload", uploadRoutes);

export default router;
