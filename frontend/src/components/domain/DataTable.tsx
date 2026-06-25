import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  /** Cell renderer. */
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide on small screens. */
  hideOnMobile?: boolean;
}

/**
 * Generic responsive table used across the admin panel.
 * On mobile, columns marked `hideOnMobile` collapse away.
 */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: ReactNode;
}) {
  if (rows.length === 0 && empty) {
    return <div className="rounded-2xl border border-slate-200 bg-white">{empty}</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-4 py-3 font-medium",
                    c.hideOnMobile && "hidden md:table-cell",
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
                {columns.map((c, i) => (
                  <td
                    key={i}
                    className={cn(
                      "px-4 py-3 align-middle text-slate-700",
                      c.hideOnMobile && "hidden md:table-cell",
                      c.className
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
