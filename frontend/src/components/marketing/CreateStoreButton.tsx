"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, X, Users, Store } from "lucide-react";
import { Button } from "@/components/ui";

export function CreateStoreButton({
  size = "lg",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="accent"
        size={size}
        rightIcon={<ArrowRight className="h-4 w-4" />}
        className={className}
        onClick={() => setOpen(true)}
      >
        Create free store
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Users className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Need help setting up your store?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              You can create your store yourself in minutes — it's free and easy.
              Or if you'd prefer, our team is available to help you set everything up.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 font-medium text-white transition hover:bg-brand-800"
              >
                <Users className="h-4 w-4" />
                Contact our team
              </Link>
              <Link
                href="/signup?role=seller"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Store className="h-4 w-4" />
                Create store myself
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
