import type { IconType } from "react-icons";
import {
  FaDiscord,
  FaFacebook,
  FaGlobe,
  FaInstagram,
  FaLinkedin,
  FaReddit,
  FaTiktok,
  FaXTwitter,
} from "react-icons/fa6";

export type SocialPlatform =
  | "website"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "twitter"
  | "reddit"
  | "discord";

export interface SocialConfig {
  key: SocialPlatform;
  label: string;
  icon: IconType;
  placeholder: string;
  /** Brand colour for the icon (Tailwind classes). */
  className: string;
  /** Link for a bare username / handle. */
  profileUrl: (handle: string) => string;
}

/** Social links a seller can add, in the order they're shown on the shop. */
export const SOCIALS: SocialConfig[] = [
  {
    key: "website",
    label: "Website",
    icon: FaGlobe,
    placeholder: "www.yourshop.com",
    className: "text-slate-700",
    profileUrl: (h) => `https://${h}`,
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: FaInstagram,
    placeholder: "username or link",
    className: "text-[#E4405F]",
    profileUrl: (h) => `https://instagram.com/${h}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: FaFacebook,
    placeholder: "page name or link",
    className: "text-[#1877F2]",
    profileUrl: (h) => `https://facebook.com/${h}`,
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: FaTiktok,
    placeholder: "username or link",
    className: "text-black",
    profileUrl: (h) => `https://tiktok.com/@${h}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: FaLinkedin,
    placeholder: "profile or company link",
    className: "text-[#0A66C2]",
    profileUrl: (h) => `https://linkedin.com/${/^(in|company)\//.test(h) ? h : `in/${h}`}`,
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    icon: FaXTwitter,
    placeholder: "username or link",
    className: "text-black",
    profileUrl: (h) => `https://x.com/${h}`,
  },
  {
    key: "reddit",
    label: "Reddit",
    icon: FaReddit,
    placeholder: "r/community, u/username or link",
    className: "text-[#FF4500]",
    profileUrl: (h) => `https://reddit.com/${/^(r|u|user)\//.test(h) ? h : `u/${h}`}`,
  },
  {
    key: "discord",
    label: "Discord",
    icon: FaDiscord,
    placeholder: "invite link or code",
    className: "text-[#5865F2]",
    profileUrl: (h) => `https://discord.gg/${h}`,
  },
];

export const SOCIAL_LABEL = Object.fromEntries(SOCIALS.map((s) => [s.key, s.label])) as Record<SocialPlatform, string>;

/**
 * Turn what the seller typed (full link, "www.…" or just a handle) into a
 * safe https link. Only http(s) links are kept as-is.
 */
export function socialHref(social: SocialConfig, value: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  // "shop.pk" is a site, but "ali.store" on Facebook/Instagram is a username —
  // so other platforms need a path ("instagram.com/ali") to count as a link.
  const domain = social.key === "website" ? /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i : /^[a-z0-9-]+(\.[a-z0-9-]+)+\//i;
  if (domain.test(v)) return `https://${v}`;
  return social.profileUrl(v.replace(/^@/, "").replace(/^\/+/, ""));
}

/** The socials a store has filled in, in display order. */
export function storeSocials(socials?: Partial<Record<SocialPlatform, string>>) {
  return SOCIALS.filter((s) => socials?.[s.key]?.trim()).map((s) => ({
    ...s,
    href: socialHref(s, socials![s.key]!),
  }));
}
