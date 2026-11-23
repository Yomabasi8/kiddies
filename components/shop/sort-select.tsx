"use client";

import type { ShopSort } from "@/lib/catalog/types";
import { SHOP_FORM_ID } from "./shop-filters";

const OPTIONS: { value: ShopSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popularity" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

/** Sort dropdown that belongs to the shop filter form. */
export function SortSelect({ value }: { value: ShopSort }) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-ink/60">
      Sort by
      <select
        form={SHOP_FORM_ID}
        name="sort"
        defaultValue={value}
        onChange={() => (document.getElementById(SHOP_FORM_ID) as HTMLFormElement | null)?.requestSubmit()}
        className="h-10 rounded-full border-2 border-ink/10 bg-white pl-3 pr-8 text-sm font-bold text-ink outline-none focus:border-brand"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
