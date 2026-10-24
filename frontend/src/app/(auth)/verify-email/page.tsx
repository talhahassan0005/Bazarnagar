"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useVerifyEmailMutation } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";

/**
 * Page the verification email links to: `/verify-email?token=…`. Verifies
 * the seller's email, logs them in and sends them to set up their store.
 */
export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}

function VerifyEmail() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useSearchParams().get("token") ?? "";
  const [verify] = useVerifyEmailMutation();
  const [error, setError] = useState(token ? "" : "This page needs the link from your verification email.");
  const started = useRef(false);

  useEffect(() => {
    // The token is single-use: don't send it twice (React dev double-mount).
    if (!token || started.current) return;
    started.current = true;
    verify({ token })
      .unwrap()
      .then(() => {
        dispatch(addToast("Email verified — your account is active. Let's set up your store.", "success"));
        router.replace("/dashboard/store");
      })
      .catch((err) => setError(getErrorMessage(err, "Could not verify your email.")));
  }, [token, verify, dispatch, router]);

  if (error) {
    return (
      <AuthCard
        title="Verification failed"
        subtitle={error}
        icon={<MailCheck className="h-5 w-5" />}
        footer={{ text: "Need help?", linkText: "Contact us", href: "/contact" }}
      >
        <p className="text-sm text-slate-600">
          Log in with your email and password. If your email isn&apos;t verified yet, you can get a new link there.
        </p>
        <Button href="/login?role=seller" fullWidth className="mt-4">
          Go to log in
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verifying your email…"
      subtitle="This only takes a moment."
      icon={<MailCheck className="h-5 w-5" />}
      footer={{ text: "Wrong page?", linkText: "Back to log in", href: "/login?role=seller" }}
    >
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    </AuthCard>
  );
}
