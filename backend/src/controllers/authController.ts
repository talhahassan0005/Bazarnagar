import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Seller } from "../models/Seller";
import { Admin } from "../models/Admin";
import { Store } from "../models/Store";
import { signToken } from "../lib/jwt";
import { ApiError, asyncHandler } from "../lib/helpers";

const signupSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** POST /api/auth/signup — register a new seller. */
export const signupSeller = asyncHandler(async (req: Request, res: Response) => {
  const data = signupSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 10);

  const seller = await Seller.create({
    name: data.name,
    phone: data.phone,
    email: data.email,
    passwordHash,
    planId: "starter",
    subscriptionStatus: "trial",
    status: "active",
  });

  const token = signToken({ sub: seller.id, role: "seller" });
  res.status(201).json({ token, seller: seller.toJSON() });
});

/** POST /api/auth/login — seller login. */
export const loginSeller = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const seller = await Seller.findOne({ email: data.email });
  if (!seller || !(await seller.comparePassword(data.password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (seller.status === "suspended") {
    throw new ApiError(403, "Your account has been suspended. Contact support.");
  }
  const token = signToken({ sub: seller.id, role: "seller" });
  res.json({ token, seller: seller.toJSON() });
});

/** POST /api/admin/login — admin login. */
export const loginAdmin = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const admin = await Admin.findOne({ email: data.email });
  if (!admin || !(await admin.comparePassword(data.password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  const token = signToken({ sub: admin.id, role: "admin" });
  res.json({ token, admin: admin.toJSON() });
});

/** GET /api/auth/me — current authenticated identity. */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "Authentication required");
  if (req.user.role === "admin") {
    const admin = await Admin.findById(req.user.id);
    if (!admin) throw new ApiError(404, "Admin not found");
    return res.json({ role: "admin", admin: admin.toJSON() });
  }
  const seller = await Seller.findById(req.user.id);
  if (!seller) throw new ApiError(404, "Seller not found");
  const store = seller.storeId ? await Store.findById(seller.storeId) : null;
  res.json({ role: "seller", seller: seller.toJSON(), store: store?.toJSON() ?? null });
});
