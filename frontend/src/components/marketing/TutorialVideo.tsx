"use client";

import { useEffect, useState } from "react";
import { useCountry } from "@/lib/useCountry";
import type { TutorialVideos } from "@/lib/types";

const FALLBACK = "https://www.youtube.com/embed/4iA8eouRtjI";

function toEmbedUrl(url: string): string {
  if (!url) return "";
  // Already an embed URL
  if (url.includes("youtube.com/embed/")) return url;
  // youtu.be/ID
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  // youtube.com/watch?v=ID
  const watch = url.match(/[?&]v=([^?&]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  return url;
}

export function TutorialVideo({ videos }: { videos?: TutorialVideos | null }) {
  const { country } = useCountry();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isUrdu = country === "Pakistan";
  const key = isUrdu
    ? (isMobile ? "urduMobile" : "urduDesktop")
    : (isMobile ? "englishMobile" : "englishDesktop");

  const raw = videos?.[key] ?? "";
  const src = toEmbedUrl(raw) || FALLBACK;

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
