import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TILES = [
  { x: 1, y: 1, fill: "#1b3a5b" }, // navy
  { x: 25, y: 1, fill: "#e85d2c" }, // orange
  { x: 1, y: 25, fill: "#f5a623" }, // amber
  { x: 25, y: 25, fill: "#1f6b2e" }, // green
];

/** Compact SVG brand mark — 2x2 shop tiles in the logo's four colors. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label={SITE_NAME}>
      {TILES.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${t.y})`}>
          <rect width="22" height="22" rx="5" fill={t.fill} />
          {/* white house silhouette with a door cut-out */}
          <path
            d="M11 4 L18 9 L18 18 L4 18 L4 9 Z"
            fill="#fff"
          />
          <rect x="9" y="12" width="4" height="6" rx="1" fill={t.fill} />
        </g>
      ))}
    </svg>
  );
}

/** Brand mark + wordmark, used in navbars and sidebars. */
export function Logo({
  href = "/",
  className,
  invert,
}: {
  href?: string;
  className?: string;
  invert?: boolean;
}) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      <BrandMark className="h-8 w-8 transition-transform duration-300 group-hover:scale-105" />
      <span
        className={cn(
          "text-lg font-bold tracking-tight",
          invert ? "text-white" : "text-brand-700"
        )}
      >
        Bazaar<span className="text-accent-500">nagar</span>
      </span>
    </Link>
  );
}

/** Full logo lockup (the supplied PNG) — for auth screens, footer, hero. */
export function LogoImage({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src="/Logo.png"
      alt={SITE_NAME}
      className={className}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
