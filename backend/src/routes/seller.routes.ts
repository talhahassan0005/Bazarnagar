import { Router } from "express";
import {
  getMe,
  getMyStore,
  upsertStore,
  updateStoreLanding,
  changePlan,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getDashboard,
} from "../controllers/sellerController";
import { getSellerOrders, updateOrderStatus } from "../controllers/orderController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// All seller routes require a logged-in seller.
router.use(authenticate, requireRole("seller"));

router.get("/me", getMe);
router.get("/store", getMyStore);
router.put("/store", upsertStore);
router.patch("/store/landing", updateStoreLanding);
router.patch("/plan", changePlan);
router.get("/dashboard", getDashboard);

router.get("/products", getMyProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/orders", getSellerOrders);
router.patch("/orders/:id/status", updateOrderStatus);

export default router;
