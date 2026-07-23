"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function MockPayRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/plan"); }, [router]);
  return null;
}
