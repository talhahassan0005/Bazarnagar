import type { ModerationStatus } from "../models/Product";

/**
 * Basic rule-based content moderation (SRS §12).
 *
 * Scans product name, description and tags for risky keywords. The prototype
 * rule is: safe products auto-approve, risky products are flagged for admin
 * review (admin keeps final control).
 *
 * This is intentionally simple and conservative. It is NOT a substitute for a
 * real moderation service — it only catches obvious banned terms.
 */

const BANNED_PATTERNS: { reason: string; words: string[] }[] = [
  {
    reason: "weapons",
    words: ["gun", "pistol", "rifle", "ammo", "ammunition", "grenade", "explosive", "firearm"],
  },
  {
    reason: "drugs",
    words: ["cocaine", "heroin", "meth", "marijuana", "weed", "hashish", "opium", "mdma"],
  },
  {
    reason: "adult content",
    words: ["porn", "xxx", "nude", "escort", "sex toy", "viagra"],
  },
  {
    reason: "scam / fraud",
    words: ["fake currency", "counterfeit", "hacked account", "stolen", "money doubling", "ponzi"],
  },
  {
    reason: "hate speech",
    words: ["kill all", "genocide"],
  },
  {
    reason: "harmful medical claims",
    words: ["cures cancer", "miracle cure", "guaranteed weight loss"],
  },
];

export interface ModerationResult {
  status: Extract<ModerationStatus, "approved" | "flagged">;
  reason?: string;
}

export function moderateProduct(input: {
  name?: string;
  description?: string;
  tags?: string[];
}): ModerationResult {
  const haystack = [input.name ?? "", input.description ?? "", (input.tags ?? []).join(" ")]
    .join(" ")
    .toLowerCase();

  for (const group of BANNED_PATTERNS) {
    const hit = group.words.find((w) => haystack.includes(w));
    if (hit) {
      return { status: "flagged", reason: `Possible ${group.reason} (matched "${hit}")` };
    }
  }

  return { status: "approved" };
}
