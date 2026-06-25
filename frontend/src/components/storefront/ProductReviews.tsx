"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Input, Textarea } from "@/components/ui";
import { StarRating } from "./StarRating";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useCreateReviewMutation, useGetProductReviewsQuery } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";

/** Reviews list + average rating + a guest review form for a product. */
export function ProductReviews({ productId }: { productId: string }) {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetProductReviewsQuery(productId);
  const [createReview, { isLoading: submitting }] = useCreateReviewMutation();

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createReview({ productId, customerName: name, rating, comment }).unwrap();
      dispatch(addToast("Thanks! Your review will appear once approved.", "success"));
      setName("");
      setRating(5);
      setComment("");
    } catch (err) {
      dispatch(
        addToast(getErrorMessage(err, "Could not submit review"), "error")
      );
    }
  }

  const reviews = data?.reviews ?? [];

  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-900">Reviews</h2>
        {data && data.count > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            <StarRating value={data.average} />
            {data.average.toFixed(1)} · {data.count} review{data.count > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* List */}
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{r.customerName}</p>
                  <StarRating value={r.rating} size={14} />
                </div>
                {r.comment && <p className="mt-2 text-sm text-slate-600">{r.comment}</p>}
              </div>
            ))
          )}
        </div>

        {/* Form */}
        <Card className="h-fit">
          <CardHeader title="Write a review" />
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-3">
              <Input
                label="Your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Rating</span>
                <StarRating value={rating} onChange={setRating} size={24} />
              </div>
              <Textarea
                label="Comment (optional)"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button type="submit" fullWidth disabled={submitting}>
                {submitting ? "Submitting…" : "Submit review"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
