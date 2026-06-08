import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "accent"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "whatsapp";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-700 text-white hover:bg-brand-800 focus-visible:ring-brand-500 shadow-sm shadow-brand-700/20",
  accent:
    "bg-accent-500 text-white hover:bg-accent-600 focus-visible:ring-accent-400 shadow-sm shadow-accent-500/25",
  secondary:
    "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-500 shadow-sm",
  outline:
    "border border-slate-300 bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50 focus-visible:ring-brand-300",
  ghost: "text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm",
  whatsapp:
    "bg-whatsapp text-white hover:bg-whatsapp-dark focus-visible:ring-whatsapp shadow-sm shadow-whatsapp/25",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

const base =
  "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap active:scale-[0.97]";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Allowed on link variants too — a disabled link renders as an inert button. */
  disabled?: boolean;
}

type ButtonProps = CommonProps &
  ComponentProps<"button"> & { href?: undefined };
type AnchorProps = CommonProps &
  Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export type Props = ButtonProps | AnchorProps;

/** Polymorphic button — renders a <Link> when `href` is provided, else a <button>. */
export function Button(props: Props) {
  const {
    variant = "primary",
    size = "md",
    fullWidth,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    ...rest
  } = props as CommonProps & {
    className?: string;
    children?: ReactNode;
    href?: string;
  };

  const classes = cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
  const content = (
    <>
      {leftIcon}
      {children}
      {rightIcon}
    </>
  );

  // A disabled link can't navigate — render an inert button instead.
  if ("href" in props && props.href && !disabled) {
    const { href, ...anchorRest } = rest as AnchorProps;
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {content}
      </Link>
    );
  }

  // Strip link-only props that aren't valid on a native <button>.
  const buttonProps = { ...(rest as Record<string, unknown>) };
  delete buttonProps.href;
  delete buttonProps.target;
  delete buttonProps.rel;

  return (
    <button
      className={classes}
      disabled={disabled}
      {...(buttonProps as ComponentProps<"button">)}
    >
      {content}
    </button>
  );
}
