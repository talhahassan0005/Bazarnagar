import type { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Review } from "../models/Review";
import { Product } from "../models/Product";
import { ApiError, asyncHandler } from "../lib/helpers";

/** Aggregate average rating + count for a product (approved reviews only). */
export async function ratingSummary(productId: Types.ObjectId | string) {
  const [agg] = await Review.aggregate<{ average: number; count: number }>([
    {
      $match: {
        productId: new Types.ObjectId(productId.toString()),
        status: "approved",
      },
    },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  return {
    average: agg ? Math.round(agg.average * 10) / 10 : 0,
    count: agg?.count ?? 0,
  };
}

/** GET /api/public/products/:id/reviews — approved reviews + rating summary. */
export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await Review.find({ productId: req.params.id, status: "approved" }).sort({
    createdAt: -1,
  });
  const summary = await ratingSummary(req.params.id!);
  res.json({ reviews: reviews.map((r) => r.toJSON()), ...summary });
});

const createReviewSchema = z.object({
  customerName: z.string().min(2),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

/** POST /api/public/products/:id/reviews — leave a guest review. */
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const data = createReviewSchema.parse(req.body);
  const product = await Product.findOne({
    _id: req.params.id,
    status: "active",
    moderationStatus: "approved",
  });
  if (!product) throw new ApiError(404, "Product not found");

  const review = await Review.create({
    productId: product._id,
    storeId: product.storeId,
    customerName: data.customerName,
    rating: data.rating,
    comment: data.comment,
    // Reviews await admin approval before showing publicly.
    status: "pending",
  });

  res.status(201).json(review.toJSON());
});

/* --------------------------------- Admin ---------------------------------- */

/** GET /api/admin/reviews — all reviews (+ product name) for moderation. */
export const getAllReviews = asyncHandler(async (_req: Request, res: Response) => {
  const reviews = await Review.find().sort({ createdAt: -1 });
  const productIds = [...new Set(reviews.map((r) => r.productId.toString()))];
  const products = await Product.find({ _id: { $in: productIds } });
  const nameById = new Map(products.map((p) => [p.id, p.name]));
  res.json(
    reviews.map((r) => ({
      ...r.toJSON(),
      productName: nameById.get(r.productId.toString()) ?? "(deleted product)",
    }))
  );
});

const moderateReviewSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

/** PATCH /api/admin/reviews/:id — approve / reject a review. */
export const moderateReview = asyncHandler(async (req: Request, res: Response) => {
  const { status } = moderateReviewSchema.parse(req.body);
  const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!review) throw new ApiError(404, "Review not found");
  res.json(review.toJSON());
});
