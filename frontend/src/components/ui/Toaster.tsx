"use client";

import { useEffect } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dismissToast, type Toast } from "@/store/uiSlice";
import { cn } from "@/lib/utils";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};
const TONES = {
  success: "text-leaf-600",
  error: "text-red-600",
  info: "text-brand-600",
};

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  const Icon = ICONS[toast.type];

  useEffect(() => {
    const t = setTimeout(() => dispatch(dismissToast(toast.id)), 3000);
    return () => clearTimeout(t);
  }, [dispatch, toast.id]);

  return (
    <div className="flex w-80 max-w-[calc(100vw-2rem)] animate-fade-in-up items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg">
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", TONES[toast.type])} />
      <p className="flex-1 text-sm text-slate-700">{toast.message}</p>
      <button
        onClick={() => dispatch(dismissToast(toast.id))}
        className="rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Global toast stack, fed by the ui slice. */
export function Toaster() {
  const toasts = useAppSelector((s) => s.ui.toasts);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
