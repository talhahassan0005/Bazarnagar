"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { getErrorMessage } from "@/lib/utils";

/**
 * Shown when a page's data request fails — instead of an endless skeleton or
 * a misleading "nothing here yet".
 */
export function LoadError({ what, error, onRetry }: { what: string; error: unknown; onRetry: () => void }) {
  return (
    <EmptyState
      icon={<AlertTriangle className="h-6 w-6" />}
      title={`Couldn't load ${what}`}
      description={getErrorMessage(error, "The server didn't respond. Please try again.")}
      action={
        <Button variant="outline" onClick={onRetry} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Try again
        </Button>
      }
    />
  );
}
