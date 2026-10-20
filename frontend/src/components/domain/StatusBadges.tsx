import { MODERATION_META } from "@/lib/constants";
import type {
  DeliveryOption,
  ModerationStatus,
  OrderStatus,
  ProductStatus,
  StockStatus,
  SubscriptionStatus,
} from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Badge, type BadgeTone } from "@/components/ui";

export function ModerationBadge({ status }: { status: ModerationStatus }) {
  const meta = MODERATION_META[status];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}

export function StockBadge({ status }: { status: StockStatus }) {
  return status === "in_stock" ? (
    <Badge tone="green" dot>
      In stock
    </Badge>
  ) : (
    <Badge tone="red" dot>
      Sold out
    </Badge>
  );
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return status === "active" ? (
    <Badge tone="green">Active</Badge>
  ) : (
    <Badge tone="gray">Inactive</Badge>
  );
}

const SUBSCRIPTION_TONE: Record<SubscriptionStatus, BadgeTone> = {
  trial: "blue",
  active: "green",
  expired: "amber",
  suspended: "red",
  cancelled: "gray",
};

export function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <Badge tone={SUBSCRIPTION_TONE[status]} className="capitalize">
      {status}
    </Badge>
  );
}

/** Delivery availability tag for a product ("Available" / "Not available" / "Negotiable"). */
export function DeliveryBadge({ option, fee }: { option: DeliveryOption; fee?: number }) {
  if (option === "not_available") return <Badge tone="gray">No delivery</Badge>;
  if (option === "negotiable") return <Badge tone="amber">Delivery negotiable</Badge>;
  return (
    <Badge tone="blue">
      {fee ? `Delivery ${formatPrice(fee)}` : "Free delivery"}
    </Badge>
  );
}

const ORDER_STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  pending: "amber",
  confirmed: "blue",
  shipped: "brand",
  delivered: "green",
  cancelled: "red",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={ORDER_STATUS_TONE[status]} className="capitalize">
      {status}
    </Badge>
  );
}
