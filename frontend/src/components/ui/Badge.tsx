import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "gray"
  | "green"
  | "amber"
  | "red"
  | "blue"
  | "orange"
  | "brand";

const tones: Record<BadgeTone, string> = {
  gray: "bg-slate-100 text-slate-600",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  orange: "bg-orange-100 text-orange-700",
  brand: "bg-brand-100 text-brand-700",
};

export function Badge({
  tone = "gray",
  children,
  className,
  dot,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
