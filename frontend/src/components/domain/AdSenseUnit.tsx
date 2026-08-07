"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Renders one Google AdSense ad unit. Requires the AdSense script to already
 * be loaded on the page (see `AdSenseScript` in the root layout) and a
 * publisher id + slot id from the admin's Ad Settings.
 */
export function AdSenseUnit({
  publisherId,
  slotId,
  className,
}: {
  publisherId: string;
  slotId: string;
  className?: string;
}) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense script not loaded yet (e.g. blocked by an ad blocker) — safe to ignore.
    }
  }, []);

  return (
    <ins
      ref={ref}
      className={`adsbygoogle block ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={publisherId}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
