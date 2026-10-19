"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";

/** Facebook "f" mark (lucide no longer ships brand icons). */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}

/**
 * "Share" for a shop. On phones it opens the native share sheet (WhatsApp,
 * Instagram, SMS…); elsewhere a small dialog with WhatsApp, Facebook and
 * copy-link. `hero` styles it for the dark landing-page banner.
 */
export function ShareStoreButton({
  store,
  variant = "outline",
  className,
}: {
  store: { name: string; slug: string };
  variant?: "outline" | "hero";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = () => `${window.location.origin}/store/${store.slug}`;
  const message = () => `Check out ${store.name} on ${SITE_NAME}: ${url()}`;

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: store.name, text: `Check out ${store.name} on ${SITE_NAME}`, url: url() });
        return;
      } catch (err) {
        // The user closed the share sheet — nothing else to do.
        if ((err as Error).name === "AbortError") return;
      }
    }
    setOpen(true);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the link is still shown to copy by hand */
    }
  }

  const option =
    "flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50/50";

  return (
    <>
      {variant === "hero" ? (
        <button
          type="button"
          onClick={share}
          className={cn(
            "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 text-base font-medium text-white backdrop-blur transition-colors hover:bg-white/20",
            className
          )}
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
      ) : (
        <Button variant="outline" onClick={share} leftIcon={<Share2 className="h-4 w-4" />} className={className}>
          Share
        </Button>
      )}

      {open && (
        <Modal open onClose={() => setOpen(false)} title={`Share ${store.name}`}>
          <div className="space-y-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message())}`}
              target="_blank"
              rel="noopener noreferrer"
              className={option}
            >
              <MessageCircle className="h-5 w-5 text-[#25D366]" /> Share on WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`}
              target="_blank"
              rel="noopener noreferrer"
              className={option}
            >
              <FacebookIcon className="h-5 w-5 text-[#1877F2]" /> Share on Facebook
            </a>
            <button type="button" onClick={copy} className={cn(option, "w-full")}>
              {copied ? <Check className="h-5 w-5 text-brand-600" /> : <Copy className="h-5 w-5 text-slate-500" />}
              {copied ? "Link copied!" : "Copy link"}
            </button>
            <p className="truncate pt-1 text-center text-xs text-slate-400">{url()}</p>
          </div>
        </Modal>
      )}
    </>
  );
}
