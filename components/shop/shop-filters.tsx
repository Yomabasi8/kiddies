"use client";

import Form from "next/form";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Category, ShopQuery } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

export const SHOP_FORM_ID = "shop-filters";

type Props = {
  query: ShopQuery;
  categories: Category[];
  ageFilters: { label: string; months: number }[];
  materials: string[];
  autoFocusSearch: boolean;
  activeCount: number;
  /** Results, rendered beside the filter sidebar. */
  children: React.ReactNode;
};

/**
 * Shop filters as a GET form: works without JavaScript, and with it every
 * change navigates instantly (text fields wait for a pause in typing).
 */
export function ShopFilters({ query, categories, ageFilters, materials, autoFocusSearch, activeCount, children }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [open, setOpen] = useState(false);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  function handleChange(e: React.FormEvent<HTMLFormElement>) {
    const el = e.target as HTMLInputElement;
    clearTimeout(timer.current);
    const typing = el.type === "search" || el.type === "number";
    timer.current = setTimeout(() => formRef.current?.requestSubmit(), typing ? 500 : 0);
  }

  const minNaira = query.minPrice !== undefined ? query.minPrice / 100 : "";
  const maxNaira = query.maxPrice !== undefined ? query.maxPrice / 100 : "";

  return (
    <>
      {/* Search bar + mobile filter toggle */}
      <div className="flex gap-3">
        <label className="relative flex-1">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink/40" aria-hidden="true" />
          <input
            form={SHOP_FORM_ID}
            type="search"
            name="q"
            defaultValue={query.q}
            autoFocus={autoFocusSearch}
            placeholder="Search bottles, bibs, toys…"
            onChange={() => {
              clearTimeout(timer.current);
              timer.current = setTimeout(() => formRef.current?.requestSubmit(), 500);
            }}
            className="h-13 w-full rounded-full border-2 border-ink/10 bg-white py-3.5 pl-12 pr-5 text-[15px] outline-none transition-colors focus:border-brand"
          />
        </label>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative inline-flex items-center gap-2 rounded-full border-2 border-ink px-5 text-sm font-bold lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-coral text-[11px] text-white">{activeCount}</span>
          )}
        </button>
      </div>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-ink/40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="mt-8 grid gap-10 lg:grid-cols-[250px_1fr]">
      <Form
        ref={formRef}
        id={SHOP_FORM_ID}
        action="/shop"
        scroll={false}
        onChange={handleChange}
        onSubmit={() => setOpen(false)}
        aria-label="Product filters"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[86%] max-w-sm overflow-y-auto bg-white p-6 shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:w-auto lg:max-w-none lg:translate-x-0 lg:overflow-visible lg:p-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        data-lenis-prevent
      >
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <h2 className="font-display text-2xl font-semibold">Filters</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="grid size-10 place-items-center rounded-full bg-[#F5F6F8]">
            <X className="size-5" />
          </button>
        </div>

        <Fieldset legend="Category">
          <Radio name="category" value="" label="All categories" checked={!query.category} />
          {categories.map((c) => (
            <Radio key={c.id} name="category" value={c.slug} label={c.name} checked={query.category === c.slug} />
          ))}
        </Fieldset>

        <Fieldset legend="Price (₦)">
          <div className="flex items-center gap-2">
            <input type="number" name="min" min={0} step={500} inputMode="numeric" placeholder="Min" defaultValue={minNaira} aria-label="Minimum price in Naira" className="h-11 w-full min-w-0 rounded-xl border-2 border-ink/10 px-3 text-sm outline-none focus:border-brand" />
            <span className="text-ink/40">–</span>
            <input type="number" name="max" min={0} step={500} inputMode="numeric" placeholder="Max" defaultValue={maxNaira} aria-label="Maximum price in Naira" className="h-11 w-full min-w-0 rounded-xl border-2 border-ink/10 px-3 text-sm outline-none focus:border-brand" />
          </div>
        </Fieldset>

        <Fieldset legend="Suitable for">
          <select name="age" defaultValue={query.ageMonths ?? ""} aria-label="Child's age" className="h-11 w-full rounded-xl border-2 border-ink/10 bg-white px-3 text-sm outline-none focus:border-brand">
            <option value="">Any age</option>
            {ageFilters.map((a) => (
              <option key={a.months} value={a.months}>
                {a.label}
              </option>
            ))}
          </select>
        </Fieldset>

        <Fieldset legend="Material">
          <select name="material" defaultValue={query.material ?? ""} aria-label="Material" className="h-11 w-full rounded-xl border-2 border-ink/10 bg-white px-3 text-sm outline-none focus:border-brand">
            <option value="">Any material</option>
            {materials.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Fieldset>

        <Fieldset legend="Availability">
          <Check name="in_stock" label="In stock only" checked={!!query.inStock} />
          <Check name="on_sale" label="On sale" checked={!!query.onSale} />
        </Fieldset>

        <noscript>
          <button type="submit" className="mt-2 h-11 w-full rounded-full bg-brand font-bold text-white">
            Apply filters
          </button>
        </noscript>
        <button type="submit" className="mt-2 h-12 w-full rounded-full bg-brand font-bold text-white lg:hidden">
          Show results
        </button>
      </Form>
      <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="mb-7">
      <legend className="mb-3 font-display text-lg font-semibold text-ink">{legend}</legend>
      <div className="space-y-2">{children}</div>
    </fieldset>
  );
}

function Radio({ name, value, label, checked }: { name: string; value: string; label: string; checked: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-[15px] text-ink/80 hover:text-ink">
      <input type="radio" name={name} value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-ink/25 transition-colors peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-sunny">
        <span className="size-1.5 rounded-full bg-white" />
      </span>
      <span className="leading-snug peer-checked:font-bold peer-checked:text-ink">{label}</span>
    </label>
  );
}

function Check({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[15px] text-ink/80 hover:text-ink">
      <input type="checkbox" name={name} value="true" defaultChecked={checked} className="peer sr-only" />
      <span className="grid size-5 place-items-center rounded-md border-2 border-ink/25 transition-colors peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-sunny">
        <svg viewBox="0 0 12 12" className="size-3 text-white" aria-hidden="true">
          <path d="M2 6.5 5 9l5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {label}
    </label>
  );
}
