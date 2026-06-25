import type { ReactNode } from "react";
import { SellerShell } from "@/components/layout/SellerShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <SellerShell>{children}</SellerShell>;
}
