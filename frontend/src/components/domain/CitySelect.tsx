"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui";
import { CITIES } from "@/lib/constants";
import { useGetCitiesQuery } from "@/store/apiSlice";

const OTHER = "__other__";

const isListed = (city: string) =>
  (CITIES as readonly string[]).some((c) => c.toLowerCase() === city.trim().toLowerCase());

/**
 * Cities for search/shop filters: the common cities first, then any other
 * city a live shop has typed in, so those shops can be found too.
 */
export function useFilterCities(): string[] {
  const { data: live = [] } = useGetCitiesQuery();
  return [...CITIES, ...live.filter((c) => !isListed(c))];
}

/**
 * City picker: the common cities plus "Other", which reveals a text box so
 * people outside the list can type their own city. `value` is the city name.
 */
export function CitySelect({
  label = "City",
  value,
  onChange,
  required,
}: {
  label?: string;
  value: string;
  onChange: (city: string) => void;
  required?: boolean;
}) {
  // "Other" stays open while the typed city is still empty.
  const [otherPicked, setOtherPicked] = useState(false);
  const isOther = otherPicked || (Boolean(value) && !isListed(value));

  return (
    <div className="space-y-3">
      <Select
        label={label}
        required={required}
        placeholder="Select a city"
        value={isOther ? OTHER : value}
        onChange={(e) => {
          if (e.target.value === OTHER) {
            setOtherPicked(true);
            onChange("");
          } else {
            setOtherPicked(false);
            onChange(e.target.value);
          }
        }}
        options={[
          ...CITIES.map((c) => ({ value: c, label: c })),
          { value: OTHER, label: "Other (type your city)" },
        ]}
      />
      {isOther && (
        <Input
          label="Your city"
          required={required}
          maxLength={60}
          placeholder="e.g. Mandi Bahauddin"
          autoFocus={otherPicked}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
