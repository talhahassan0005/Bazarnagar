"use client";

import { useState } from "react";
import { CreditCard, User } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StripePaymentSettings } from "@/components/domain/StripePaymentSettings";
import { AccountSettings } from "@/components/domain/AccountSettings";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "payments", label: "Payment methods", icon: CreditCard },
  { id: "account", label: "Account", icon: User },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("payments");

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage how you get paid and your account details."
      />

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
                active ? "text-brand-700" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content — keyed so it micro-animates on switch */}
      <div key={tab} className="animate-fade-in">
        {tab === "payments" ? <StripePaymentSettings /> : <AccountSettings />}
      </div>
    </>
  );
}
