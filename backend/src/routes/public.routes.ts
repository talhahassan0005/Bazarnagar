import { Router } from "express";
import {
  getStores,
  getCities,
  getStoreBySlug,
  getStoreProducts,
  getProduct,
  getRelatedProducts,
  searchProducts,
  trackWhatsappClick,
  trackStoreWhatsappClick,
  trackButtonClick,
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
import { getAdSettings } from "../controllers/adSettingsController";
import { optionalAuthenticate } from "../middleware/auth";

const router = Router();

router.get("/plans", getPlanConfig);
router.get("/banners", getActiveBanners);
router.get("/ad-settings", getAdSettings);
router.get("/search", searchProducts);
router.get("/stores", getStores);
router.get("/cities", getCities);
router.get("/stores/:slug", optionalAuthenticate, getStoreBySlug);
router.get("/stores/:storeId/products", getStoreProducts);
router.get("/products/:id", optionalAuthenticate, getProduct);
router.get("/products/:id/related", getRelatedProducts);
router.post("/products/:id/whatsapp-click", optionalAuthenticate, trackWhatsappClick);
router.post("/stores/:id/whatsapp-click", optionalAuthenticate, trackStoreWhatsappClick);
router.post("/products/:id/button-click", optionalAuthenticate, trackButtonClick);
router.get("/products/:id/reviews", getProductReviews);
router.post("/products/:id/reviews", createReview);
router.post("/orders", optionalAuthenticate, createOrder);
router.get("/orders/by-ids", getOrdersByIds);
router.get("/payment-config", getPaymentConfig);
router.post("/stripe/checkout", optionalAuthenticate, createStripeCheckout);
router.post("/stripe/mock-confirm", mockConfirmOrder);

export default router;
