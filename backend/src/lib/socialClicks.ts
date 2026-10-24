import { Types } from "mongoose";
import { z } from "zod";
import { SocialClick, SOCIAL_PLATFORMS, type SocialPlatform } from "../models/SocialClick";

export const socialClicksQuerySchema = z.object({ days: z.enum(["7", "30", "90", "all"]).default("30") });

type Counts = Partial<Record<SocialPlatform, number>>;

export interface SocialClickReport {
  total: number;
  totals: Counts;
  /** Newest first; only days with at least one click (dates in Pakistan time). */
  days: { date: string; total: number; counts: Counts }[];
}

/** Clicks for the last `days` days, or all time. */
export function sinceFilter(days: "7" | "30" | "90" | "all") {
  return days === "all" ? {} : { createdAt: { $gte: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000) } };
}

/** Social link clicks of one store, per platform and per day. */
export async function socialClickReport(storeId: Types.ObjectId | string, days: "7" | "30" | "90" | "all"): Promise<SocialClickReport> {
  const rows: { _id: { date: string; platform: SocialPlatform }; n: number }[] = await SocialClick.aggregate([
    { $match: { storeId: new Types.ObjectId(String(storeId)), ...sinceFilter(days) } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Karachi" } },
          platform: "$platform",
        },
        n: { $sum: 1 },
      },
    },
  ]);

  const totals: Counts = {};
  const byDay = new Map<string, Counts>();
  for (const { _id, n } of rows) {
    totals[_id.platform] = (totals[_id.platform] ?? 0) + n;
    const day = byDay.get(_id.date) ?? {};
    day[_id.platform] = n;
    byDay.set(_id.date, day);
  }
  const sum = (c: Counts) => SOCIAL_PLATFORMS.reduce((s, p) => s + (c[p] ?? 0), 0);

  return {
    total: sum(totals),
    totals,
    days: [...byDay.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, counts]) => ({ date, total: sum(counts), counts })),
  };
}
