import { Router } from "express";
import { loginAdmin } from "../controllers/authController";
import {
  getAllSellers,
  getAllStores,
  getAllProducts,
  getOverview,
  updateSeller,
  updateStore,
  moderateProductStatus,
  removeProduct,
  recordPayment,
  getSellerPayments,
} from "../controllers/adminController";
import { getAllReviews, moderateReview } from "../controllers/reviewController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// Public admin login.
router.post("/login", loginAdmin);

// Everything below requires an authenticated admin.
router.use(authenticate, requireRole("admin"));

router.get("/overview", getOverview);

router.get("/sellers", getAllSellers);
router.patch("/sellers/:id", updateSeller);
router.get("/sellers/:id/payments", getSellerPayments);
router.post("/sellers/:id/payments", recordPayment);

router.get("/stores", getAllStores);
router.patch("/stores/:id", updateStore);

router.get("/products", getAllProducts);
router.patch("/products/:id/moderation", moderateProductStatus);
router.delete("/products/:id", removeProduct);

router.get("/reviews", getAllReviews);
router.patch("/reviews/:id", moderateReview);

export default router;
