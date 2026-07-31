import { Router } from "express";
import {
  getStores,
  getStoreBySlug,
  getStoreProducts,
  getProduct,
  searchProducts,
  trackWhatsappClick,
} from "../controllers/publicController";
import { createOrder, getOrdersByIds } from "../controllers/orderController";
import {
  createStripeCheckout,
  mockConfirmOrder,
  getPaymentConfig,
} from "../controllers/stripeController";
import { getProductReviews, createReview } from "../controllers/reviewController";
import { getPlanConfig } from "../controllers/adminController";
import { getActiveBanners } from "../controllers/bannerController";

const router = Router();

router.get("/plans", getPlanConfig);
router.get("/banners", getActiveBanners);
router.get("/search", searchProducts);
router.get("/stores", getStores);
router.get("/stores/:slug", getStoreBySlug);
router.get("/stores/:storeId/products", getStoreProducts);
router.get("/products/:id", getProduct);
router.post("/products/:id/whatsapp-click", trackWhatsappClick);
router.get("/products/:id/reviews", getProductReviews);
router.post("/products/:id/reviews", createReview);
router.post("/orders", createOrder);
router.get("/orders/by-ids", getOrdersByIds);
router.get("/payment-config", getPaymentConfig);
router.post("/stripe/checkout", createStripeCheckout);
router.post("/stripe/mock-confirm", mockConfirmOrder);

export default router;
