import { Router } from "express";
import {
  getMe,
  getMyStore,
  upsertStore,
  updateStoreLanding,
  updateStorePayout,
  changePlan,
  renewSubscription,
  subscriptionCheckout,
  subscriptionCallback,
  getSubscriptionStatus,
  toggleAutoRenew,
  cancelSubscription,
  getMyPayments,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  boostProduct,
  getDashboard,
} from "../controllers/sellerController";
import { getSellerOrders, updateOrderStatus } from "../controllers/orderController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("seller"));

router.get("/me", getMe);
router.get("/store", getMyStore);
router.put("/store", upsertStore);
router.patch("/store/landing", updateStoreLanding);
router.patch("/store/payout", updateStorePayout);
router.patch("/plan", changePlan);
router.post("/subscription/renew", renewSubscription);
router.post("/subscription/checkout", subscriptionCheckout);
router.get("/subscription/callback", subscriptionCallback);
router.get("/subscription/status", getSubscriptionStatus);
router.post("/subscription/toggle-auto-renew", toggleAutoRenew);
router.post("/subscription/cancel", cancelSubscription);
router.get("/payments", getMyPayments);
router.get("/dashboard", getDashboard);

router.get("/products", getMyProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.post("/products/:id/boost", boostProduct);

router.get("/orders", getSellerOrders);
router.patch("/orders/:id/status", updateOrderStatus);

export default router;
