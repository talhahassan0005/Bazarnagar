"use client";

import { PageHeader } from "@/components/layout/DashboardShell";
import { AccountSettings } from "@/components/domain/AccountSettings";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your account details." />
      <AccountSettings />
    </>
  );
}
