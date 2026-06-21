import { Router } from "express";
import { signupSeller, loginSeller, getMe } from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/signup", signupSeller);
router.post("/login", loginSeller);
router.get("/me", authenticate, getMe);

export default router;
