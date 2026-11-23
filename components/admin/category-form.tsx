"use client";

import { startTransition, useActionState, useState } from "react";
import { AlertCircle, Archive, RotateCcw } from "lucide-react";
import { archiveCategory, restoreCategory, saveCategory, type CategoryFormState } from "@/lib/admin/category-actions";
import { CATEGORY_ACCENTS, CATEGORY_ICONS, type CategoryFormValues } from "@/lib/admin/category-types";
import { slugify } from "@/lib/admin/product-types";
import { ACCENT_STYLES, CategoryIcon } from "@/components/storefront/category-icon";
import type { Accent, CategoryIconKey } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { ImageUploader } from "./image-uploader";
import { btn, field } from "./ui";

type Props = {
  initial: CategoryFormValues;
  archived: boolean;
  productCount: number;
  otherCategories: { id: string; name: string }[];
};

export function CategoryForm({ initial, archived, productCount, otherCategories }: Props) {
  const [v, setV] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [state, action, pending] = useActionState(saveCategory, { status: "idle" } as CategoryFormState);
  const [moveTo, setMoveTo] = useState("");
  const [archiveMsg, setArchiveMsg] = useState("");
  const [archiving, setArchiving] = useState(false);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const set = <K extends keyof CategoryFormValues>(k: K, val: CategoryFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("payload", JSON.stringify(v));
    startTransition(() => action(fd));
  }

  async function archive() {
    setArchiving(true);
    const r = await archiveCategory(v.id!, moveTo || null);
    if (r && !r.ok) setArchiveMsg(r.message);
    setArchiving(false);
  }

  const images = v.imageUrl ? [{ url: v.imageUrl, alt: v.name, style: v.imageStyle, isPrimary: true }] : [];

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {state.status === "error" && (
          <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle className="size-4" /> {state.message}
          </p>
        )}
        <section className="space-y-4 rounded-xl border border-ink/10 bg-white p-5">
          <Field label="Category name" error={errors.name}>
            <input className={field} value={v.name} aria-invalid={!!errors.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
          </Field>
          <Field label="URL name" hint={`/shop?category=${v.slug || "…"}`} error={errors.slug}>
            <input className={field} value={v.slug} aria-invalid={!!errors.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
          </Field>
          <Field label="Description" hint="Optional">
            <textarea className={cn(field, "h-24 py-2")} value={v.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </section>

        <section className="space-y-3 rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="text-[15px] font-bold">Category image</h2>
          <p className="text-xs text-ink/50">Shown on category cards. Without an image, the icon is shown instead.</p>
          <ImageUploader
            images={images}
            error={errors.imageUrl}
            onChange={(next) => {
              const last = next[next.length - 1];
              set("imageUrl", last?.url ?? "");
              if (last) set("imageStyle", last.style);
            }}
          />
        </section>

        <section className="space-y-4 rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="text-[15px] font-bold">Icon & colour</h2>
          <div role="radiogroup" aria-label="Icon" className="flex flex-wrap gap-2">
            {CATEGORY_ICONS.map((icon) => (
              <button key={icon} type="button" role="radio" aria-checked={v.icon === icon} aria-label={icon} onClick={() => set("icon", icon)}
                className={cn("grid size-12 place-items-center rounded-xl border-2", v.icon === icon ? "border-brand bg-brand/10" : "border-ink/10 hover:border-ink/30")}>
                <CategoryIcon icon={icon as CategoryIconKey} className="size-5" />
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-2">
            {CATEGORY_ACCENTS.map((a) => (
              <button key={a} type="button" role="radio" aria-checked={v.accent === a} aria-label={a} onClick={() => set("accent", a)}
                className={cn("size-10 rounded-full border-2", ACCENT_STYLES[a as Accent].bg, v.accent === a ? "border-ink ring-2 ring-ink/20" : "border-ink/10")} />
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="space-y-4 rounded-xl border border-ink/10 bg-white p-5">
          <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
            Visible in the shop
            <input type="checkbox" role="switch" checked={v.isVisible} onChange={(e) => set("isVisible", e.target.checked)} className="size-5 accent-[#086f54]" />
          </label>
          <Field label="Display order" hint="Lower numbers show first" error={errors.sortOrder}>
            <input className={field} inputMode="numeric" value={v.sortOrder} onChange={(e) => set("sortOrder", e.target.value.replace(/\D/g, ""))} />
          </Field>
          <button type="submit" disabled={pending} className={cn(btn.primary, "w-full")}>{pending ? "Saving…" : v.id ? "Save changes" : "Create category"}</button>
        </section>

        {v.id && (
          <section className="space-y-3 rounded-xl border border-ink/10 bg-white p-5">
            <h2 className="text-[15px] font-bold">{archived ? "Archived" : "Archive category"}</h2>
            {archived ? (
              <button type="button" onClick={() => restoreCategory(v.id!)} className={cn(btn.secondary, "w-full")}><RotateCcw className="size-4" /> Restore category</button>
            ) : (
              <>
                <p className="text-xs text-ink/55">
                  {productCount
                    ? `This category has ${productCount} product${productCount === 1 ? "" : "s"}. Move them to another category first.`
                    : "Hides the category. It can be restored later."}
                </p>
                {productCount > 0 && (
                  <select className={field} value={moveTo} onChange={(e) => setMoveTo(e.target.value)} aria-label="Move products to">
                    <option value="">Move products to…</option>
                    {otherCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                {archiveMsg && <p role="alert" className="text-xs font-semibold text-red-600">{archiveMsg}</p>}
                <button type="button" disabled={archiving || (productCount > 0 && !moveTo)} onClick={archive} className={cn(btn.secondary, "w-full")}>
                  <Archive className="size-4" /> {productCount ? "Move products & archive" : "Archive category"}
                </button>
              </>
            )}
          </section>
        )}
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactElement }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      {children}
      {error ? <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-ink/50">{hint}</span> : null}
    </label>
  );
}
