"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Input } from "@/components/ui";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

/**
 * Image field with a file picker (uploads to the backend `/upload` endpoint)
 * plus a URL fallback. `value` is the image URL; `onChange` receives the new
 * URL after an upload or manual edit.
 */
export function ImageUpload({
  value,
  onChange,
  label,
  required,
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}) {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      onChange(url);
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Upload failed"), "error"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
      )}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Upload image"
          className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-brand-300 hover:bg-brand-50"
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/75 text-[10px] font-medium text-brand-700">
              Uploading…
            </span>
          )}
        </button>
        <div className="flex-1 space-y-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-sm font-medium text-brand-700 hover:underline disabled:opacity-50"
          >
            {uploading ? "Uploading…" : value ? "Change image" : "Upload image"}
          </button>
          <Input
            value={value}
            placeholder="https://… or upload a file"
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}
