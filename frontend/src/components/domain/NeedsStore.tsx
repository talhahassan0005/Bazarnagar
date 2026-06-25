import { Store } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

/**
 * Shown on store-dependent dashboard pages when the seller hasn't created
 * their store profile yet (landing config, products, etc. all need a store).
 */
export function NeedsStore({ message }: { message?: string }) {
  return (
    <EmptyState
      icon={<Store className="h-6 w-6" />}
      title="Set up your store first"
      description={
        message ??
        "Create your store profile before this — it only takes a minute."
      }
      action={<Button href="/dashboard/store">Create store profile</Button>}
    />
  );
}
