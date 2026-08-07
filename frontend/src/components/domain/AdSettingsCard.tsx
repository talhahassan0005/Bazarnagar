"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Select, Toggle, Skeleton } from "@/components/ui";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/uiSlice";
import { useGetAdminAdSettingsQuery, useUpdateAdSettingsMutation } from "@/store/apiSlice";
import { getErrorMessage } from "@/lib/utils";
import type { AdPlacementSource, AdSettings } from "@/lib/types";

const PLACEMENTS: { key: keyof AdSettings["placements"]; label: string }[] = [
  { key: "top", label: "Top banner" },
  { key: "bottom", label: "Bottom banner" },
  { key: "sidebar", label: "Sidebar banner" },
];

const SOURCE_OPTIONS = [
  { value: "manual", label: "Manual banners" },
  { value: "adsense", label: "Google AdSense" },
  { value: "off", label: "Off (show nothing)" },
];

/** Lets the admin choose, per slot, whether to show manual banners or Google AdSense. */
export function AdSettingsCard() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetAdminAdSettingsQuery();
  const [updateAdSettings, { isLoading: saving }] = useUpdateAdSettingsMutation();

  const [form, setForm] = useState<AdSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  function setPlacementSource(key: keyof AdSettings["placements"], source: AdPlacementSource) {
    setForm((f) => (f ? { ...f, placements: { ...f.placements, [key]: { ...f.placements[key], source } } } : f));
  }

  function setPlacementSlotId(key: keyof AdSettings["placements"], adsenseSlotId: string) {
    setForm((f) =>
      f ? { ...f, placements: { ...f.placements, [key]: { ...f.placements[key], adsenseSlotId } } } : f
    );
  }

  async function onSave() {
    if (!form) return;
    try {
      await updateAdSettings(form).unwrap();
      dispatch(addToast("Ad settings saved", "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Could not save ad settings"), "error"));
    }
  }

  const usesAdsense = Object.values(form.placements).some((p) => p.source === "adsense");

  return (
    <Card>
      <CardHeader
        title="Ad Settings"
        subtitle="Choose whether each slot on free-plan shop pages shows your manual banners or Google AdSense."
      />
      <CardBody className="space-y-5">
        <Toggle
          label="Google AdSense"
          description="Turn on once you have an approved AdSense account and publisher ID."
          checked={form.adsenseEnabled}
          onChange={(v) => setForm((f) => (f ? { ...f, adsenseEnabled: v } : f))}
        />

        {(form.adsenseEnabled || usesAdsense) && (
          <Input
            label="AdSense publisher ID"
            placeholder="ca-pub-1234567890123456"
            hint="From your AdSense account — Account → Settings → Account information."
            value={form.adsensePublisherId ?? ""}
            onChange={(e) => setForm((f) => (f ? { ...f, adsensePublisherId: e.target.value } : f))}
          />
        )}

        <div className="space-y-4 border-t border-slate-100 pt-4">
          {PLACEMENTS.map(({ key, label }) => {
            const config = form.placements[key];
            return (
              <div key={key} className="grid gap-3 sm:grid-cols-2">
                <Select
                  label={label}
                  value={config.source}
                  onChange={(e) => setPlacementSource(key, e.target.value as AdPlacementSource)}
                  options={SOURCE_OPTIONS}
                />
                {config.source === "adsense" && (
                  <Input
                    label="AdSense slot ID"
                    placeholder="1234567890"
                    value={config.adsenseSlotId ?? ""}
                    onChange={(e) => setPlacementSlotId(key, e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button size="sm" loading={saving} onClick={onSave}>
            Save ad settings
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
