"use client";

import Link from "next/link";
import { Mail, Phone, User } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { useAppSelector } from "@/store/hooks";

/** Read-only seller account info shown under Settings → Account. */
export function AccountSettings() {
  const seller = useAppSelector((s) => s.auth.seller);

  const rows = [
    { icon: User, label: "Name", value: seller?.name },
    { icon: Mail, label: "Email", value: seller?.email },
    { icon: Phone, label: "Phone", value: seller?.phone },
  ];

  return (
    <Card>
      <CardHeader title="Account details" subtitle="Your seller account information." />
      <CardBody>
        <div className="divide-y divide-slate-100">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <r.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">{r.label}</p>
                <p className="truncate text-sm font-medium text-slate-800">{r.value || "—"}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          To change your account details, contact support. Your shop name, logo and contact info
          are managed in{" "}
          <Link href="/dashboard/store" className="font-medium text-brand-700 hover:underline">
            Store Profile
          </Link>
          .
        </p>
      </CardBody>
    </Card>
  );
}
