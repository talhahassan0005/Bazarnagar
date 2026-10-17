import type { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Seller } from "../models/Seller";
import { Admin } from "../models/Admin";
import { Customer } from "../models/Customer";
import { Store } from "../models/Store";
import { PasswordReset } from "../models/PasswordReset";
import { signToken } from "../lib/jwt";
import { sendMail } from "../lib/mailer";
import { addTrialPeriod } from "../lib/plans";
import { env } from "../config/env";
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

  if (await Customer.findOne({ email: data.email })) {
    throw new ApiError(409, "This email already has a buyer account. Please use a different email or log in as a buyer.");
  }
  if (await Seller.findOne({ email: data.email })) {
    throw new ApiError(409, "This email already has a seller account. Please log in instead.");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const now = new Date();
  const seller = await Seller.create({
    name: data.name,
    phone: data.phone,
    email: data.email,
    passwordHash,
    planId: "starter",
    subscriptionStatus: "trial",
    subscriptionStartedAt: now,
    subscriptionEndsAt: addTrialPeriod(now),
    status: env.kycRequired ? "pending" : "active",
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

/** POST /api/auth/customer/signup — register a new customer (buyer). */
export const signupCustomer = asyncHandler(async (req: Request, res: Response) => {
  const data = signupSchema.parse(req.body);

  if (await Seller.findOne({ email: data.email })) {
    throw new ApiError(409, "This email already has a seller account. Please use a different email or log in as a seller.");
  }
  if (await Customer.findOne({ email: data.email })) {
    throw new ApiError(409, "This email already has a buyer account. Please log in instead.");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const customer = await Customer.create({
    name: data.name,
    phone: data.phone,
    email: data.email,
    passwordHash,
  });

  const token = signToken({ sub: customer.id, role: "customer" });
  res.status(201).json({ token, customer: customer.toJSON() });
});

/** POST /api/auth/customer/login — customer login. */
export const loginCustomer = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const customer = await Customer.findOne({ email: data.email });
  if (!customer || !(await customer.comparePassword(data.password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  const token = signToken({ sub: customer.id, role: "customer" });
  res.json({ token, customer: customer.toJSON() });
});

/* ----------------------------- Password reset ----------------------------- */

const RESET_TTL_MINUTES = 30;

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

function resetEmail(name: string, link: string) {
  const subject = "Reset your Bazaarnagar password";
  const text = [
    `Hi ${name},`,
    "",
    "We received a request to reset your Bazaarnagar password. Open this link to choose a new one:",
    link,
    "",
    `The link expires in ${RESET_TTL_MINUTES} minutes and can only be used once.`,
    "If you didn't ask for this, you can ignore this email — your password won't change.",
  ].join("\n");
  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1e293b">
  <h2 style="color:#1b3a5b;margin-bottom:8px">Reset your password</h2>
  <p>Hi ${escapeHtml(name)},</p>
  <p>We received a request to reset your Bazaarnagar password. Click the button below to choose a new one.</p>
  <p style="margin:28px 0">
    <a href="${link}" style="background:#1b3a5b;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Reset password</a>
  </p>
  <p style="font-size:13px;color:#64748b">Or copy this link into your browser:<br><a href="${link}" style="color:#e85d2c;word-break:break-all">${link}</a></p>
  <p style="font-size:13px;color:#64748b">The link expires in ${RESET_TTL_MINUTES} minutes and can only be used once. If you didn't ask for this, you can ignore this email — your password won't change.</p>
</div>`;
  return { subject, text, html };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email() });

/**
 * POST /api/auth/forgot-password — email a one-time reset link to a seller or
 * buyer. Always answers the same way so it can't be used to probe which
 * emails are registered.
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotSchema.parse(req.body);

  const seller = await Seller.findOne({ email });
  const customer = seller ? null : await Customer.findOne({ email });
  const account = seller ?? customer;

  if (account) {
    const accountType = seller ? "seller" : "customer";
    const token = crypto.randomBytes(32).toString("hex");
    // Only the newest link stays valid.
    await PasswordReset.deleteMany({ accountId: account._id });
    await PasswordReset.create({
      accountType,
      accountId: account._id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000),
    });

    const link = `${env.appUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
    try {
      await sendMail({ to: account.email, ...resetEmail(account.name, link) });
    } catch (err) {
      console.error("Failed to send password reset email:", err);
      throw new ApiError(503, "We couldn't send the email right now. Please try again in a few minutes.");
    }
  }

  res.json({ ok: true });
});

const resetSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

/** POST /api/auth/reset-password — set a new password using an emailed token. */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = resetSchema.parse(req.body);

  const reset = await PasswordReset.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!reset) {
    throw new ApiError(400, "This reset link is invalid or has expired. Please request a new one.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const updated =
    reset.accountType === "seller"
      ? await Seller.findByIdAndUpdate(reset.accountId, { passwordHash })
      : await Customer.findByIdAndUpdate(reset.accountId, { passwordHash });
  await PasswordReset.deleteMany({ accountId: reset.accountId });
  if (!updated) throw new ApiError(404, "Account not found");

  res.json({ ok: true, role: reset.accountType });
});

/** GET /api/auth/me — current authenticated identity. */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "Authentication required");
  if (req.user.role === "admin") {
    const admin = await Admin.findById(req.user.id);
    if (!admin) throw new ApiError(404, "Admin not found");
    return res.json({ role: "admin", admin: admin.toJSON() });
  }
  if (req.user.role === "customer") {
    const customer = await Customer.findById(req.user.id);
    if (!customer) throw new ApiError(404, "Customer not found");
    return res.json({ role: "customer", customer: customer.toJSON() });
  }
  const seller = await Seller.findById(req.user.id);
  if (!seller) throw new ApiError(404, "Seller not found");
  const store = seller.storeId ? await Store.findById(seller.storeId) : null;
  res.json({ role: "seller", seller: seller.toJSON(), store: store?.toJSON() ?? null });
});
