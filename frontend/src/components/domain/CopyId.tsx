"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** A record ID in small monospace with a one-click copy (admin tables). */
export function CopyId({ id, label = "ID" }: { id: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the ID is selectable text */
    }
  }

  return (
    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
      <span className="select-all font-mono">
        {label}: {id}
      </span>
      <button
        type="button"
        onClick={copy}
        className="rounded p-0.5 hover:bg-slate-100 hover:text-slate-600"
        aria-label={`Copy ${label}`}
        title={`Copy ${label}`}
      >
        {copied ? <Check className="h-3 w-3 text-brand-600" /> : <Copy className="h-3 w-3" />}
      </button>
    </p>
  );
}
