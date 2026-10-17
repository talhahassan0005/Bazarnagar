import { Router } from "express";
import {
  signupSeller,
  loginSeller,
  signupCustomer,
  loginCustomer,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/signup", signupSeller);
router.post("/login", loginSeller);
router.post("/customer/signup", signupCustomer);
router.post("/customer/login", loginCustomer);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, getMe);

export default router;
