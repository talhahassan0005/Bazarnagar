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
    words: [
      "buy gun", "sell gun", "gun for sale", "pistol for sale", "rifle for sale",
      "ammo for sale", "ammunition for sale", "grenade", "explosive device",
      "firearm for sale", "illegal weapon", "revolver for sale", "shotgun for sale",
      "carbine", "sniper rifle", "ak47", "ak-47", "9mm for sale", "bullet for sale",
    ],
  },
  {
    reason: "drugs / narcotics",
    words: [
      "cocaine", "heroin", "meth", "methamphetamine", "marijuana", "weed", "hashish",
      "opium", "mdma", "ecstasy", "lsd", "crystal meth", "crack cocaine", "cannabis",
      "charas", "ganja", "bhang", "ice drug", "speed drug", "smack drug",
    ],
  },
  {
    reason: "adult / sexually explicit content",
    words: [
      "porn", "pornography", "xxx", "nude", "nudity", "naked", "explicit content",
      "adult content", "adult video", "sex video", "sexual content", "erotic",
      "escort service", "call girl", "prostitute", "sexual service",
      "sex chat", "adult entertainment",
    ],
  },
  {
    reason: "sexual products",
    words: [
      "sex toy", "dildo", "vibrator", "fleshlight", "butt plug", "anal toy",
      "male masturbator", "female masturbator", "adult toy", "pleasure toy",
      "love doll", "sex doll", "bdsm", "bondage kit", "handcuffs adult",
      "penis pump", "breast pump adult", "nipple clamp", "cock ring",
    ],
  },
  {
    reason: "sexual / performance medicines",
    words: [
      "viagra", "sildenafil", "cialis", "tadalafil", "levitra", "vardenafil",
      "sexual medicine", "sex medicine", "sex capsule", "sex tablet", "sex power",
      "sex booster", "sex enhancer", "sexual enhancer", "penis enlargement",
      "breast enlargement pill", "breast enlargement cream",
      "male enhancement", "female enhancement", "libido booster",
      "timing tablet", "timing spray", "delay spray", "delay cream",
      "erection pill", "erection cream", "mardana kamzori",
      "mardana taqat", "jinsee taqat", "jinsee kamzori",
      "badhao capsule", "longer lasting", "last longer pill",
      "sexual stamina", "jism barhao", "nafs ka ilaj", "nafs barhao",
      "لنگ بڑھاؤ", "مردانہ کمزوری", "جنسی کمزوری", "جنسی طاقت",
      "وایگرا", "سیکس کیپسول",
    ],
  },
  {
    reason: "medicines / pharmaceuticals (not allowed on this platform)",
    words: [
      // Core medicine words (English)
      "medicine", "medication", "medicated", "medicinal",
      "tablet", "tablets", "capsule", "capsules", "pill", "pills",
      "syrup", "injection", "injections", "vaccine", "vaccines",
      "pharmaceutical", "pharma", "drug store", "medical store", "pharmacy",
      "ointment", "gel medicine", "drops medicine", "patch medicine",
      "suppository", "inhaler", "nebulizer",

      // Roman Urdu
      "dawai", "dawa", "dawi", "goli", "nuskha", "hakim nuskha",
      "tibbi", "unani", "homeopathic", "herbal medicine", "herbal tablet",
      "herbal capsule", "herbal syrup", "ayurvedic",

      // Urdu script
      "دوائی", "دوا", "گولی", "کیپسول", "شربت", "انجیکشن", "ٹیبلٹ",
      "دوائیں", "نسخہ", "حکیم", "طبی",

      // Prescription / OTC common names
      "paracetamol", "panadol", "calpol", "ibuprofen", "brufen",
      "aspirin", "disprin", "amoxicillin", "augmentin", "flagyl",
      "metronidazole", "metformin", "omeprazole", "nexium", "cetirizine",
      "loratadine", "chlorpheniramine", "azithromycin", "ciprofloxacin",
      "doxycycline", "clotrimazole", "fluconazole", "pantoprazole",
      "ranitidine", "cimetidine", "domperidone", "metoclopramide",

      // Category terms
      "antibiotic", "antibiotics", "antifungal", "antiviral", "antibacterial",
      "antihistamine", "antacid", "antidepressant", "antipsychotic",
      "antimalarial", "antidiabetic", "antihypertensive",
      "cough syrup", "cough medicine", "cold medicine", "fever medicine",
      "eye drop", "ear drop", "nasal spray", "nasal drop",
      "blood pressure medicine", "diabetes medicine", "sugar medicine",
      "cholesterol medicine", "thyroid medicine", "liver medicine",
      "kidney medicine", "heart medicine",

      // Vitamins / supplements as medicines
      "vitamin tablet", "vitamin capsule", "multivitamin",
      "iron tablet", "zinc tablet", "calcium tablet",
      "fish oil capsule", "omega 3 capsule",

      // Pain / sleep / mental
      "painkiller", "pain killer", "sleeping pill", "sleep tablet",
      "sedative", "tranquilizer", "antidepressant tablet",

      // Steroids / hormones
      "steroid", "anabolic steroid", "testosterone", "growth hormone", "hgh",
      "insulin", "dexamethasone", "prednisolone", "cortisone",

      // Sexual / performance medicines
      "viagra", "sildenafil", "cialis", "tadalafil", "levitra", "vardenafil",
      "timing tablet", "timing spray", "delay spray", "delay cream",
      "erection pill", "erection cream", "sex capsule", "sex tablet",
      "sex medicine", "sex power", "sex booster", "mardana kamzori",
      "mardana taqat", "jinsee taqat", "jinsee kamzori", "nafs ka ilaj",
      "لنگ بڑھاؤ", "مردانہ کمزوری", "جنسی کمزوری", "جنسی طاقت", "وایگرا", "سیکس کیپسول",
    ],
  },
  {
    reason: "scam / fraud",
    words: [
      "fake currency", "counterfeit", "hacked account", "stolen goods",
      "money doubling", "ponzi", "get rich quick", "fake notes",
      "original fake", "replica branded",
    ],
  },
  {
    reason: "hate speech",
    words: ["kill all", "genocide"],
  },
  {
    reason: "harmful medical claims",
    words: [
      "cures cancer", "miracle cure", "guaranteed weight loss",
      "100% cure", "permanent cure guaranteed", "instant cure",
    ],
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
