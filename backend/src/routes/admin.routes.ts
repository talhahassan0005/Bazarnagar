import { Router } from "express";
import { loginAdmin } from "../controllers/authController";
import {
  getAllSellers,
  getBuyers,
  exportBuyers,
  getAdminOrders,
  exportAdminOrders,
  getAllStores,
  getAllProducts,
  getOverview,
  getActivityLogs,
  exportActivityLogs,
  getDataSummary,
  getStorageUsage,
  getSearchInsights,
  getSearchLogs,
  exportSearchLogs,
  updateSeller,
  updateStore,
  getStoreReviews,
  getSocialClicksByStore,
  getStoreSocialClicks,
  markStoreReviewed,
  moderateProductStatus,
  removeProduct,
  recordPayment,
  getSellerPayments,
  getPlanConfig,
  updatePlanConfig,
  getSubscriptionSettingsHandler,
  updateSubscriptionSettings,
  getPaymentConfigHandler,
  updatePaymentConfig,
  getBoostConfig,
  updateBoostConfig,
} from "../controllers/adminController";
import { getAllReviews, moderateReview } from "../controllers/reviewController";
import {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "../controllers/bannerController";
import {
  getAllPaymentRequests,
  getManualPaymentSettings,
  reviewPaymentRequest,
  updateManualPaymentSettings,
} from "../controllers/paymentRequestController";
import { getAdSettings, updateAdSettings } from "../controllers/adSettingsController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// Public admin login.
router.post("/login", loginAdmin);

// Everything below requires an authenticated admin.
router.use(authenticate, requireRole("admin"));

router.get("/overview", getOverview);
router.get("/activity", getActivityLogs);
router.get("/activity/export", exportActivityLogs);
router.get("/data-summary", getDataSummary);
router.get("/storage", getStorageUsage);
router.get("/search-insights", getSearchInsights);
router.get("/search-logs", getSearchLogs);
router.get("/search-logs/export", exportSearchLogs);

router.get("/sellers", getAllSellers);
router.get("/buyers", getBuyers);
router.get("/buyers/export", exportBuyers);
router.get("/orders", getAdminOrders);
router.get("/orders/export", exportAdminOrders);
router.patch("/sellers/:id", updateSeller);
router.get("/sellers/:id/payments", getSellerPayments);
router.post("/sellers/:id/payments", recordPayment);

router.get("/stores", getAllStores);
router.patch("/stores/:id", updateStore);
router.get("/store-reviews", getStoreReviews);
router.patch("/stores/:id/review", markStoreReviewed);
router.get("/social-clicks", getSocialClicksByStore);
router.get("/stores/:id/social-clicks", getStoreSocialClicks);

router.get("/products", getAllProducts);
router.patch("/products/:id/moderation", moderateProductStatus);
router.delete("/products/:id", removeProduct);

router.get("/reviews", getAllReviews);
router.patch("/reviews/:id", moderateReview);

router.get("/plan-config", getPlanConfig);
router.patch("/plan-config", updatePlanConfig);
router.get("/subscription-settings", getSubscriptionSettingsHandler);
router.patch("/subscription-settings", updateSubscriptionSettings);
router.get("/plan-payment-config", getPaymentConfigHandler);
router.patch("/plan-payment-config", updatePaymentConfig);
router.get("/boost-config", getBoostConfig);
router.patch("/boost-config", updateBoostConfig);

router.get("/banners", getAllBanners);
router.post("/banners", createBanner);
router.patch("/banners/:id", updateBanner);
router.delete("/banners/:id", deleteBanner);

router.get("/payment-requests", getAllPaymentRequests);
router.patch("/payment-requests/:id", reviewPaymentRequest);
router.get("/manual-payment-settings", getManualPaymentSettings);
router.patch("/manual-payment-settings", updateManualPaymentSettings);

router.get("/ad-settings", getAdSettings);
router.patch("/ad-settings", updateAdSettings);

export default router;
