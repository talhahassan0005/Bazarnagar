"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Payments moved under Settings → Payment methods. Redirect old links. */
export default function PaymentsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/settings");
  }, [router]);
  return null;
}
