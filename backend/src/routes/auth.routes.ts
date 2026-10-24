import { Router } from "express";
import {
  signupSeller,
  loginSeller,
  signupCustomer,
  loginCustomer,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/signup", signupSeller);
router.post("/login", loginSeller);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/customer/signup", signupCustomer);
router.post("/customer/login", loginCustomer);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, getMe);

export default router;
