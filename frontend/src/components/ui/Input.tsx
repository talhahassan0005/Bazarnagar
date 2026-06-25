import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50";

interface FieldWrapProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Shared label + hint + error chrome around any control. */
export function Field({ label, hint, error, required, className, children }: FieldWrapProps) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

type InputProps = ComponentProps<"input"> & {
  label?: string;
  hint?: string;
  error?: string;
  leftAddon?: ReactNode;
};

export function Input({
  label,
  hint,
  error,
  required,
  leftAddon,
  className,
  ...rest
}: InputProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <div className="relative flex items-center">
        {leftAddon && (
          <span className="pointer-events-none absolute left-3 text-sm text-slate-400">
            {leftAddon}
          </span>
        )}
        <input
          className={cn(
            fieldBase,
            "h-11",
            leftAddon && "pl-9",
            error && "border-red-400 focus:border-red-400 focus:ring-red-100",
            className
          )}
          required={required}
          {...rest}
        />
      </div>
    </Field>
  );
}

type TextareaProps = ComponentProps<"textarea"> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Textarea({
  label,
  hint,
  error,
  required,
  className,
  rows = 4,
  ...rest
}: TextareaProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <textarea
        rows={rows}
        className={cn(
          fieldBase,
          "py-2.5 resize-y",
          error && "border-red-400 focus:border-red-400 focus:ring-red-100",
          className
        )}
        required={required}
        {...rest}
      />
    </Field>
  );
}

type SelectProps = ComponentProps<"select"> & {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
};

export function Select({
  label,
  hint,
  error,
  required,
  options,
  placeholder,
  className,
  ...rest
}: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <select
        className={cn(fieldBase, "h-11 appearance-none bg-no-repeat pr-9", className)}
        required={required}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' stroke='%2394a3b8' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundPosition: "right 0.75rem center",
        }}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
