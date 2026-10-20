"use client";

import { useState } from "react";
import { Download, Search, ShoppingBag, UserCheck, Users } from "lucide-react";
import { Avatar, Button, Input, StatCardSkeleton, TableSkeleton } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { DataTable, type Column } from "@/components/domain/DataTable";
import { StatCard } from "@/components/domain/StatCard";
import { useGetBuyersQuery } from "@/store/apiSlice";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { downloadFile } from "@/lib/api";
import { cn, formatCount, formatPrice, getErrorMessage } from "@/lib/utils";
import type { AdminBuyer } from "@/lib/types";

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("en-PK") : "—");

export default function AdminBuyersPage() {
  const dispatch = useAppDispatch();
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [downloading, setDownloading] = useState(false);
  const { data, isLoading, isFetching } = useGetBuyersQuery(
    { q: q || undefined },
    { refetchOnMountOrArgChange: true }
  );

  async function downloadCsv() {
    setDownloading(true);
    try {
      await downloadFile("/admin/buyers/export", { q: q || undefined }, "bazaarnagar-buyers.csv");
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not download the CSV"), "error"));
    } finally {
      setDownloading(false);
    }
  }

  const buyers = data ?? [];
  const withOrders = buyers.filter((b) => b.orders > 0).length;
  const totalOrders = buyers.reduce((s, b) => s + b.orders, 0);

  const columns: Column<AdminBuyer>[] = [
    {
      header: "Buyer",
      cell: (b) => (
        <div className="flex items-center gap-3">
          <Avatar name={b.name} size={36} />
          <div className="min-w-0">
            <p className="font-medium text-slate-800">{b.name}</p>
            <p className="text-xs text-slate-400">{b.email}</p>
          </div>
        </div>
      ),
    },
    { header: "Phone", hideOnMobile: true, cell: (b) => b.phone },
    { header: "Country", hideOnMobile: true, cell: (b) => b.country ?? "—" },
    {
      header: "Joined",
      hideOnMobile: true,
      cell: (b) => <span className="whitespace-nowrap text-slate-600">{when(b.createdAt)}</span>,
    },
    {
      header: "Last login",
      hideOnMobile: true,
      cell: (b) => <span className="whitespace-nowrap text-slate-600">{when(b.lastLoginAt)}</span>,
    },
    { header: "Orders", cell: (b) => formatCount(b.orders) },
    {
      header: "Total spent",
      hideOnMobile: true,
      cell: (b) => <span className="font-medium text-slate-900">{formatPrice(b.totalSpent)}</span>,
    },
    {
      header: "Last order",
      hideOnMobile: true,
      cell: (b) => <span className="whitespace-nowrap text-slate-600">{when(b.lastOrderAt)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Buyers"
        description="Buyer accounts — when they joined, last logged in, and what they've ordered."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCsv}
            loading={downloading}
            disabled={buyers.length === 0}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Download CSV
          </Button>
        }
      />

      {isLoading ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <TableSkeleton />
        </>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label={q ? "Matching buyers" : "Buyers"}
              value={formatCount(buyers.length)}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label="Have ordered"
              value={formatCount(withOrders)}
              icon={<UserCheck className="h-5 w-5" />}
              tone="leaf"
            />
            <StatCard
              label="Orders placed"
              value={formatCount(totalOrders)}
              icon={<ShoppingBag className="h-5 w-5" />}
              tone="accent"
            />
          </div>

          <form
            className="mb-4 flex max-w-md gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setQ(input.trim());
            }}
          >
            <div className="min-w-0 flex-1">
              <Input
                placeholder="Search by name, email or phone…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" leftIcon={<Search className="h-4 w-4" />}>
              Search
            </Button>
          </form>

          <div className={cn(isFetching && "opacity-60 transition-opacity")}>
            <DataTable
              columns={columns}
              rows={buyers}
              empty={
                <p className="py-10 text-center text-sm text-slate-400">
                  {q ? "No buyers match your search." : "No buyers yet."}
                </p>
              }
            />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Only buyers with an account are listed — guests who check out without signing up aren&apos;t included.
          </p>
        </>
      )}
    </>
  );
}
