import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn, field } from "./ui";

/** Read a single string search param. */
export const param = (sp: Record<string, string | string[] | undefined>, key: string) =>
  typeof sp[key] === "string" ? (sp[key] as string) : "";

/** Build a list URL, dropping empty values. */
export function listHref(base: string, params: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  return p.size ? `${base}?${p}` : base;
}

/** Strip characters that would break a PostgREST `or()` filter. */
export const safeSearch = (q: string) => q.replace(/[%_,()*\\]/g, " ").trim().slice(0, 80);

export function FilterTabs({ tabs, active }: { tabs: { key: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <nav aria-label="Filter" className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === active ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
            t.key === active ? "bg-ink text-white" : "bg-white text-ink/65 ring-1 ring-ink/10 hover:text-ink",
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={cn("rounded-full px-1.5 text-xs", t.key === active ? "bg-white/20" : "bg-ink/5")}>{t.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function SearchBar({ placeholder, defaultValue, hidden = {} }: { placeholder: string; defaultValue: string; hidden?: Record<string, string> }) {
  return (
    <form role="search" className="mb-4 flex gap-2">
      {Object.entries(hidden).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <label className="relative flex-1">
        <span className="sr-only">{placeholder}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
        <input name="q" defaultValue={defaultValue} placeholder={placeholder} className={cn(field, "bg-white pl-9")} />
      </label>
      <button type="submit" className={btn.secondary}>Search</button>
    </form>
  );
}

export function Pager({ page, pages, total, href }: { page: number; pages: number; total: number; href: (page: number) => string }) {
  if (pages <= 1) return <p className="mt-3 text-sm text-ink/50">{total} total</p>;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
      <span className="text-ink/55">Page {page} of {pages} · {total} total</span>
      <div className="flex gap-2">
        <Link aria-disabled={page <= 1} href={href(page - 1)} className={cn(btn.secondary, page <= 1 && "pointer-events-none opacity-40")}>
          <ChevronLeft className="size-4" /> Previous
        </Link>
        <Link aria-disabled={page >= pages} href={href(page + 1)} className={cn(btn.secondary, page >= pages && "pointer-events-none opacity-40")}>
          Next <ChevronRight className="size-4" />
        </Link>
      </div>
    </nav>
  );
}

export const th = "px-4 py-3";
export const td = "px-4 py-3";
export const tableHead = "bg-ink/[0.03] text-left text-xs font-bold uppercase tracking-wide text-ink/50";
