import { Router } from "express";
import authRoutes from "./auth.routes";
import publicRoutes from "./public.routes";
import sellerRoutes from "./seller.routes";
import adminRoutes from "./admin.routes";
import uploadRoutes from "./upload.routes";
import { subscriptionCallback } from "../controllers/sellerController";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));
// Subscription callback is public — Safepay/mock redirects here without auth token
router.get("/seller/subscription/callback", subscriptionCallback);

router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/seller", sellerRoutes);
router.use("/admin", adminRoutes);
router.use("/upload", uploadRoutes);

export default router;
