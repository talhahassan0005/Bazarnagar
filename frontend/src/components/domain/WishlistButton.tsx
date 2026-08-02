"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} from "@/store/apiSlice";

/** Heart toggle — saves/removes a product from the logged-in customer's wishlist. */
export function WishlistButton({ productId, className = "" }: { productId: string; className?: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const role = useAppSelector((s) => s.auth.role);
  const isCustomer = role === "customer";

  const { data: wishlist } = useGetWishlistQuery(undefined, { skip: !isCustomer });
  const [addToWishlist, { isLoading: adding }] = useAddToWishlistMutation();
  const [removeFromWishlist, { isLoading: removing }] = useRemoveFromWishlistMutation();

  const saved = Boolean(wishlist?.some((p) => p.id === productId));

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isCustomer) {
      router.push("/account/login");
      return;
    }
    try {
      if (saved) await removeFromWishlist(productId).unwrap();
      else await addToWishlist(productId).unwrap();
    } catch {
      dispatch(addToast("Something went wrong. Try again.", "error"));
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={adding || removing}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      className={`flex items-center justify-center rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur transition hover:scale-105 ${className}`}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${saved ? "fill-red-500 text-red-500" : "text-slate-500"}`}
      />
    </button>
  );
}
