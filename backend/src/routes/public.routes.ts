import { Router } from "express";
import {
  getStores,
  getStoreBySlug,
  getStoreProducts,
  getProduct,
  searchProducts,
  trackWhatsappClick,
} from "../controllers/publicController";
import { createOrder } from "../controllers/orderController";
import { getProductReviews, createReview } from "../controllers/reviewController";

const router = Router();

router.get("/search", searchProducts);
router.get("/stores", getStores);
router.get("/stores/:slug", getStoreBySlug);
router.get("/stores/:storeId/products", getStoreProducts);
router.get("/products/:id", getProduct);
router.post("/products/:id/whatsapp-click", trackWhatsappClick);
router.get("/products/:id/reviews", getProductReviews);
router.post("/products/:id/reviews", createReview);
router.post("/orders", createOrder);

export default router;
