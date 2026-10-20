"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addItem } from "@/store/cartSlice";
import { addToast } from "@/store/uiSlice";
import { useTrackButtonClickMutation } from "@/store/apiSlice";
import { buildCartItem } from "@/lib/cart";
import type { Product, Store } from "@/lib/types";

const outOfStock = (p: Product) => p.stockStatus === "out_of_stock";

/** Add the product to the cart. */
export function AddToCartButton({
  product,
  store,
  size = "md",
  fullWidth,
  variant = "outline",
}: {
  product: Product;
  store: Store;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  variant?: "primary" | "outline" | "secondary";
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isCustomer = useAppSelector((s) => s.auth.role === "customer");
  const [trackClick] = useTrackButtonClickMutation();
  const disabled = outOfStock(product);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      leftIcon={<ShoppingCart className="h-4 w-4" />}
      onClick={() => {
        // Count the intent (seller/admin analytics) — never blocks the action.
        trackClick({ productId: product.id, button: "add_to_cart" }).catch(() => {});
        if (!isCustomer) {
          dispatch(addToast("Please log in to add items to your cart", "info"));
          router.push("/login");
          return;
        }
        dispatch(addItem(buildCartItem(product, store)));
        dispatch(addToast(`Added "${product.name}" to cart`, "success"));
      }}
    >
      {disabled ? "Sold out" : "Add to cart"}
    </Button>
  );
}

/** Add the product and jump straight to checkout. */
export function BuyNowButton({
  product,
  store,
  size = "lg",
  fullWidth,
}: {
  product: Product;
  store: Store;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isCustomer = useAppSelector((s) => s.auth.role === "customer");
  const [trackClick] = useTrackButtonClickMutation();
  const disabled = outOfStock(product);

  return (
    <Button
      type="button"
      variant="accent"
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      leftIcon={<Zap className="h-4 w-4" />}
      onClick={() => {
        trackClick({ productId: product.id, button: "buy_now" }).catch(() => {});
        if (!isCustomer) {
          dispatch(addToast("Please log in to continue", "info"));
          router.push("/login");
          return;
        }
        dispatch(addItem(buildCartItem(product, store)));
        router.push("/checkout");
      }}
    >
      Buy now
    </Button>
  );
}
