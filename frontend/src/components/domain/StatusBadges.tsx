import { MODERATION_META } from "@/lib/constants";
import type {
  ModerationStatus,
  ProductStatus,
  StockStatus,
  SubscriptionStatus,
} from "@/lib/types";
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
      Out of stock
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
