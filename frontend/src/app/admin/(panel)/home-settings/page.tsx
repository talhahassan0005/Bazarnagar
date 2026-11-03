"use client";

import { useState, useEffect } from "react";
import { BrandLoader, Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout/DashboardShell";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import {
  useGetAdminHomeSettingsQuery,
  useUpdateHomeSettingsMutation,
} from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

const ROW_OPTIONS = [1, 2, 3, 4, 5];

function RowSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
    >
      {ROW_OPTIONS.map((r) => (
        <option key={r} value={r}>{r} row{r > 1 ? "s" : ""} ({r * 6} products)</option>
      ))}
    </select>
  );
}

export default function HomeSettingsPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetAdminHomeSettingsQuery();
  const [updateHomeSettings, { isLoading: isSaving }] = useUpdateHomeSettingsMutation();

  const [defaultRows, setDefaultRows] = useState(1);
  const [categoryRows, setCategoryRows] = useState<Record<string, number>>({});

  useEffect(() => {
    if (data) {
      setDefaultRows(data.defaultRows);
      setCategoryRows(data.categoryRows ?? {});
    }
  }, [data]);

  function setCatRows(cat: string, rows: number) {
    setCategoryRows((prev) => ({ ...prev, [cat]: rows }));
  }

  function resetCat(cat: string) {
    setCategoryRows((prev) => {
      const next = { ...prev };
      delete next[cat];
      return next;
    });
  }

  async function save() {
    try {
      await updateHomeSettings({ defaultRows, categoryRows }).unwrap();
      dispatch(addToast("Home page settings saved", "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Failed to save"), "error"));
    }
  }

  if (isLoading) return <BrandLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Home page catalog"
        description="Set how many rows of products are shown per category on the landing page. 1 row = 6 products on desktop."
      />

      {/* Default */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900">Default rows (all categories)</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Applied to any category that doesn't have a custom setting below.
        </p>
        <div className="mt-3">
          <RowSelect value={defaultRows} onChange={setDefaultRows} />
        </div>
      </Card>

      {/* Per-category */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900">Per-category rows</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Override the default for specific categories. "Default" means it inherits the setting above.
        </p>
        <div className="mt-4 divide-y divide-slate-100">
          {CATEGORIES.map((cat) => {
            const custom = categoryRows[cat];
            const hasCustom = custom !== undefined;
            return (
              <div key={cat} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{cat}</p>
                  {!hasCustom && (
                    <p className="text-xs text-slate-400">Using default ({defaultRows} row{defaultRows > 1 ? "s" : ""})</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <RowSelect
                    value={hasCustom ? custom : defaultRows}
                    onChange={(v) => setCatRows(cat, v)}
                  />
                  {hasCustom && (
                    <button
                      type="button"
                      onClick={() => resetCat(cat)}
                      className="text-xs text-slate-400 hover:text-red-500"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={isSaving}>Save changes</Button>
      </div>
    </div>
  );
}
