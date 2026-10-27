import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { Store } from "../models/Store";
import { Product, type ProductDoc } from "../models/Product";
import { asyncHandler } from "../lib/helpers";
import { ratingSummary } from "./reviewController";
import { withoutStats } from "../lib/publicJson";
import { SearchLog, SEARCH_LOG_MAX_PRODUCTS } from "../models/SearchLog";
import { SocialClick, SOCIAL_PLATFORMS } from "../models/SocialClick";
import { sendMail } from "../lib/mailer";
import { env } from "../config/env";

/** Only products customers may see publicly (SRS §7). */
const PUBLIC_PRODUCT_FILTER = { status: "active", moderationStatus: "approved", hiddenOverPlanLimit: { $ne: true } } as const;

/** Sort actively-boosted (featured) products first, then newest. */
function boostFirst(a: ProductDoc, b: ProductDoc): number {
  const t = Date.now();
  const ab = a.boostedUntil ? a.boostedUntil.getTime() > t : false;
  const bb = b.boostedUntil ? b.boostedUntil.getTime() > t : false;
  if (ab !== bb) return ab ? -1 : 1;
  return b.createdAt.getTime() - a.createdAt.getTime();
}

/** GET /api/public/stores/:slug — public shop page. Increments shop views. */
export const getStoreBySlug = asyncHandler(async (req: Request, res: Response) => {
  const store = await Store.findOne({ slug: req.params.slug, status: "active" });
  if (!store) return res.json(null);

  // The shop's own seller and admins see its stats, and their visits aren't counted.
  const insider = isOwnerOrAdmin(req, store.sellerId);
  if (!insider) {
    await Store.updateOne({ _id: store._id }, { $inc: { views: 1 } });
    store.views += 1;
  }

  const { Seller } = await import("../models/Seller");
  const seller = await Seller.findById(store.sellerId).select("planId");
  const json = insider ? store.toJSON() : withoutStats(store.toJSON());
  res.json({ ...json, planId: seller?.planId ?? "starter" });
});

/**
 * Exact city match ignoring case/extra spaces, so a seller's typed-in
 * "mandi bahauddin" still matches the "Mandi Bahauddin" filter.
 */
function cityMatch(city: string) {
  const escaped = city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { $regex: `^\\s*${escaped}\\s*$`, $options: "i" };
}

/**
 * GET /api/public/cities — every city that has a live, searchable shop, so
 * filters include cities sellers typed in themselves ("Other").
 */
export const getCities = asyncHandler(async (_req: Request, res: Response) => {
  const raw: string[] = await Store.distinct("city", { status: "active", showInSearch: true });
  const byKey = new Map<string, string>();
  for (const c of raw) {
    const name = c?.trim();
    if (name && !byKey.has(name.toLowerCase())) byKey.set(name.toLowerCase(), name);
  }
  res.json([...byKey.values()].sort((a, b) => a.localeCompare(b)));
});

/** GET /api/public/stores — browse all public shops (optional q / city filter). */
export const getStores = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim().toLowerCase();
  const city = req.query.city as string | undefined;

  const filter: Record<string, unknown> = { status: "active", showInSearch: true };
  if (city) filter.city = cityMatch(city);

  let stores = await Store.find(filter).sort({ views: -1 });
  if (q) {
    stores = stores.filter((s) =>
      [s.name, s.category, s.city, s.area ?? "", s.description]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }
  res.json(stores.map((s) => withoutStats(s.toJSON())));
});

/** GET /api/public/stores/:storeId/products — products for one store. */
export const getStoreProducts = asyncHandler(async (req: Request, res: Response) => {
  const publicOnly = req.query.publicOnly === "true";
  const filter: Record<string, unknown> = { storeId: req.params.storeId };
  if (publicOnly) Object.assign(filter, PUBLIC_PRODUCT_FILTER);
  const products = await Product.find(filter).sort({ createdAt: -1 });
  products.sort(boostFirst);
  res.json(products.map((p) => withoutStats(p.toJSON())));
});

/**
 * GET /api/public/products/:id — product detail. Counts a view, except when
 * the product's own seller or an admin opens it (so checks don't inflate stats).
 */
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.json(null);
  const store = await Store.findById(product.storeId);

  // Unapproved/inactive products are only visible to their own seller or an
  // admin (e.g. previewing/editing before approval) — never to the public,
  // so a stray direct link can't expose a rejected/pending listing.
  const isPublic =
    product.status === "active" && product.moderationStatus === "approved" && !product.hiddenOverPlanLimit;
  const isOwner = req.user?.role === "seller" && store?.sellerId.toString() === req.user.id;
  const isAdmin = req.user?.role === "admin";
  if (!isPublic && !isOwner && !isAdmin) return res.json(null);

  if (!isOwner && !isAdmin) {
    await Product.updateOne({ _id: product._id }, { $inc: { views: 1 } });
    product.views += 1;
  }

  const rating = await ratingSummary(product._id as Parameters<typeof ratingSummary>[0]);
  // View/click counts are only for the product's own seller and admins.
  const productJson = isOwner || isAdmin ? product.toJSON() : withoutStats(product.toJSON());
  res.json({ ...productJson, store: store ? withoutStats(store.toJSON()) : null, rating });
});

/**
 * GET /api/public/products/:id/related — other public products in the same
 * category, from any store that's live in search. Boosted products first.
 */
export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 24);
  const product = await Product.findById(req.params.id).select("category");
  if (!product) return res.json([]);

  // Over-fetch, then drop products whose store is hidden or inactive.
  const candidates = await Product.find({
    ...PUBLIC_PRODUCT_FILTER,
    category: product.category,
    _id: { $ne: product._id },
  })
    .sort({ createdAt: -1 })
    .limit(limit * 4);

  const stores = await Store.find({
    _id: { $in: [...new Set(candidates.map((p) => p.storeId.toString()))] },
    status: "active",
    showInSearch: true,
  });
  const storeById = new Map(stores.map((s) => [s.id, s]));

  const related = candidates
    .filter((p) => storeById.has(p.storeId.toString()))
    .sort(boostFirst)
    .slice(0, limit);

  res.json(
    related.map((p) => ({
      ...withoutStats(p.toJSON()),
      store: withoutStats(storeById.get(p.storeId.toString())!.toJSON()),
    }))
  );
});

/** GET /api/public/search — keyword + category/city/area search (SRS §9). */
export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim();
  const category = req.query.category as string | undefined;
  const city = req.query.city as string | undefined;
  const area = req.query.area as string | undefined;

  // Find stores that are public-searchable and (optionally) match city/area.
  const storeFilter: Record<string, unknown> = { showInSearch: true, status: "active" };
  if (city) storeFilter.city = cityMatch(city);
  if (area) storeFilter.area = area;
  const stores = await Store.find(storeFilter);
  const storeById = new Map(stores.map((s) => [s.id, s]));

  const productFilter: Record<string, unknown> = {
    ...PUBLIC_PRODUCT_FILTER,
    storeId: { $in: stores.map((s) => s._id) },
  };
  if (category) productFilter.category = category;

  let products = await Product.find(productFilter).sort({ createdAt: -1 });

  // Keyword match across product + store fields (SRS §9 searchable fields).
  if (q) {
    const needle = q.toLowerCase();
    products = products.filter((p) => {
      const store = storeById.get(p.storeId.toString());
      const haystack = [
        p.name,
        p.description ?? "",
        p.category,
        p.tags.join(" "),
        store?.name ?? "",
        store?.city ?? "",
        store?.area ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }

  products.sort(boostFirst);

  // Record keyword searches for admin insights. Browsing without a keyword
  // (home page, category chips) isn't a search; logging never blocks results.
  const term = q?.toLowerCase().replace(/\s+/g, " ").slice(0, 100);
  if (term && term.length >= 2) {
    SearchLog.create({
      query: term,
      category: category || undefined,
      city: city || undefined,
      resultCount: products.length,
      productIds: products.slice(0, SEARCH_LOG_MAX_PRODUCTS).map((p) => p._id),
    }).catch((err) => console.error("Failed to log search:", err));
  }

  res.json(
    products.map((p) => {
      const store = storeById.get(p.storeId.toString());
      return { ...withoutStats(p.toJSON()), store: store ? withoutStats(store.toJSON()) : null };
    })
  );
});

/** POST /api/public/products/:id/whatsapp-click — track an inquiry click. */
const BUTTON_FIELD = { add_to_cart: "addToCartClicks", buy_now: "buyNowClicks" } as const;
const buttonClickSchema = z.object({ button: z.enum(["add_to_cart", "buy_now"]) });

/**
 * POST /api/public/products/:id/button-click — a shopper tapped "Add to cart"
 * or "Buy now". Counted on the product and its store; taps by the product's
 * own seller or an admin aren't counted (so testing doesn't inflate stats).
 */
export const trackButtonClick = asyncHandler(async (req: Request, res: Response) => {
  const { button } = buttonClickSchema.parse(req.body);
  if (!isValidObjectId(req.params.id)) return res.json({ ok: true });
  const product = await Product.findById(req.params.id).select("storeId");
  if (!product) return res.json({ ok: true });

  const store = await Store.findById(product.storeId).select("sellerId");
  if (store && !isOwnerOrAdmin(req, store.sellerId)) {
    const inc = { $inc: { [BUTTON_FIELD[button]]: 1 } };
    await Promise.all([Product.updateOne({ _id: product._id }, inc), Store.updateOne({ _id: store._id }, inc)]);
  }
  res.json({ ok: true });
});

/**
 * POST /api/public/stores/:id/whatsapp-click — a shopper tapped the shop's own
 * WhatsApp button (header / banner / contact), not a specific product's.
 */
export const trackStoreWhatsappClick = asyncHandler(async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return res.json({ ok: true });
  const store = await Store.findOne({ _id: req.params.id, status: "active" }).select("sellerId");
  if (store && !isOwnerOrAdmin(req, store.sellerId)) {
    await Store.updateOne({ _id: store._id }, { $inc: { whatsappClicks: 1 } });
  }
  res.json({ ok: true });
});

const socialClickSchema = z.object({ platform: z.enum(SOCIAL_PLATFORMS) });

/**
 * POST /api/public/stores/:id/social-click — a shopper tapped one of the shop's
 * social links. Logged with the time so sellers see clicks by day; only links
 * the shop actually shows are counted, and not the seller's own or admin taps.
 */
export const trackSocialClick = asyncHandler(async (req: Request, res: Response) => {
  const { platform } = socialClickSchema.parse(req.body);
  if (!isValidObjectId(req.params.id)) return res.json({ ok: true });
  const store = await Store.findOne({ _id: req.params.id, status: "active" }).select("sellerId socials");
  if (store && store.socials?.[platform] && !isOwnerOrAdmin(req, store.sellerId)) {
    await SocialClick.create({ storeId: store._id, platform });
  }
  res.json({ ok: true });
});

/** True when the request comes from an admin or the store's own seller — their taps aren't counted. */
function isOwnerOrAdmin(req: Request, storeSellerId: unknown): boolean {
  if (req.user?.role === "admin") return true;
  return req.user?.role === "seller" && String(storeSellerId) === req.user.id;
}

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(3000),
});

/** POST /api/public/contact — visitor contact form submission. */
export const submitContactForm = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, subject, message } = contactSchema.parse(req.body);

  const adminEmail = env.smtp.user || env.smtp.from;

  await sendMail({
    to: adminEmail,
    replyTo: `${name} <${email}>`,
    subject: `[Contact Form] ${subject}`,
    text: `You have a new message from the Bazarnagar contact form.\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}\n\n---\nReply directly to this email to respond to ${name}.`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#1e3a8a;padding:28px 32px">
            <p style="margin:0;font-size:11px;color:#93c5fd;letter-spacing:1px;text-transform:uppercase">Bazarnagar</p>
            <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff">New Contact Form Message</h1>
          </td>
        </tr>

        <!-- Sender info -->
        <tr>
          <td style="padding:28px 32px 0">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
              <tr style="background:#f8fafc">
                <td style="padding:10px 16px;width:90px;color:#64748b;font-size:13px;font-weight:600">Name</td>
                <td style="padding:10px 16px;font-size:14px;color:#0f172a;font-weight:700">${name}</td>
              </tr>
              <tr style="border-top:1px solid #e2e8f0">
                <td style="padding:10px 16px;color:#64748b;font-size:13px;font-weight:600">Email</td>
                <td style="padding:10px 16px;font-size:14px">
                  <a href="mailto:${email}" style="color:#1d4ed8;text-decoration:none">${email}</a>
                </td>
              </tr>
              <tr style="border-top:1px solid #e2e8f0;background:#f8fafc">
                <td style="padding:10px 16px;color:#64748b;font-size:13px;font-weight:600">Subject</td>
                <td style="padding:10px 16px;font-size:14px;color:#0f172a">${subject}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Message body -->
        <tr>
          <td style="padding:24px 32px">
            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px">Message</p>
            <div style="background:#f8fafc;border-left:4px solid #1d4ed8;border-radius:0 8px 8px 0;padding:16px 20px">
              <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.7;white-space:pre-wrap">${message}</p>
            </div>
          </td>
        </tr>

        <!-- Reply CTA -->
        <tr>
          <td style="padding:0 32px 28px">
            <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="display:inline-block;background:#1e3a8a;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">
              Reply to ${name}
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px">
            <p style="margin:0;font-size:12px;color:#94a3b8">This message was submitted via the contact form on bazarnagar.com</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  res.json({ ok: true });
});

/** POST /api/public/products/:id/whatsapp-click — "Inquire on WhatsApp" on a product. */
export const trackWhatsappClick = asyncHandler(async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return res.json({ ok: true });
  const product = await Product.findById(req.params.id).select("storeId");
  if (!product) return res.json({ ok: true });
  const store = await Store.findById(product.storeId).select("sellerId");
  if (store && !isOwnerOrAdmin(req, store.sellerId)) {
    await Promise.all([
      Product.updateOne({ _id: product._id }, { $inc: { whatsappClicks: 1 } }),
      Store.updateOne({ _id: store._id }, { $inc: { whatsappClicks: 1 } }),
    ]);
  }
  res.json({ ok: true });
});
