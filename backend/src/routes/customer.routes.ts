import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { getMyOrdersCustomer } from "../controllers/orderController";
import { getWishlist, addToWishlist, removeFromWishlist } from "../controllers/wishlistController";

const router = Router();

router.use(authenticate, requireRole("customer"));

router.get("/orders", getMyOrdersCustomer);
router.get("/wishlist", getWishlist);
router.post("/wishlist", addToWishlist);
router.delete("/wishlist/:productId", removeFromWishlist);

export default router;
