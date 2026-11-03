"use client";

import { useEffect, useState } from "react";
import { useCountry } from "@/lib/useCountry";
import { useGetHomeSettingsQuery } from "@/store/apiSlice";

function toEmbedUrl(url: string): string {
  if (!url?.trim()) return "";
  if (url.includes("youtube.com/embed/")) return url;
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  const watch = url.match(/[?&]v=([^?&]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  return url;
}

/** Fetches video settings live from the API so any admin change reflects immediately. */
export function TutorialVideo() {
  const { data: settings } = useGetHomeSettingsQuery();
  const { country } = useCountry();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const videos = settings?.tutorialVideos;
  const isUrdu = country === "Pakistan";
  const key = isUrdu
    ? (isMobile ? "urduMobile" : "urduDesktop")
    : (isMobile ? "englishMobile" : "englishDesktop");

  const src = toEmbedUrl(videos?.[key] ?? "");

  if (!src) return null;

  return (
    <div className="mx-auto mt-12 w-full max-w-5xl overflow-hidden rounded-2xl shadow-xl shadow-brand-900/10">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={src}
          title="How to create your free store on Bazarnagar"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
