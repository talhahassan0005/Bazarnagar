"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only link field with a copy button (used for the public store link). */
export function CopyLink({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pl-3",
        className
      )}
    >
      <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{value}</span>
      <button
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-brand-600" /> Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" /> Copy
          </>
        )}
      </button>
    </div>
  );
}
