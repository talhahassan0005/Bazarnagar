"use client";

import Script from "next/script";
import { useGetAdSettingsQuery } from "@/store/apiSlice";

/** Loads Google's AdSense script site-wide, but only once an admin has enabled it. */
export function AdSenseScript() {
  const { data } = useGetAdSettingsQuery();
  if (!data?.adsenseEnabled || !data.adsensePublisherId) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${data.adsensePublisherId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
