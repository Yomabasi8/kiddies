"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { AlertCircle, Archive, Eye, Loader2, Plus, Trash2, Wand2, X } from "lucide-react";
import { archiveProduct, deleteProduct, generateSku, saveProduct, type ProductFormState } from "@/lib/admin/product-actions";
import {
  PRODUCT_TYPES,
  SHOWS_CAPACITY,
  SHOWS_DIMENSIONS,
  SHOWS_PIECES,
  slugify,
  type ProductFormValues,
  type ProductType,
} from "@/lib/admin/product-types";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./confirm-dialog";
import { ImageUploader } from "./image-uploader";
import { StatusBadge, btn, field } from "./ui";

type Category = { id: string; name: string };

export function ProductForm({ initial, categories }: { initial: ProductFormValues; categories: Category[] }) {
  const [v, setV] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [state, action, pending] = useActionState(saveProduct, { status: "idle" } as ProductFormState);
  const [confirm, setConfirm] = useState<null | "archive" | "delete">(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [skuBusy, setSkuBusy] = useState(false);
  const [skuHint, setSkuHint] = useState("");
  const errors = state.status === "error" ? state.fieldErrors : {};
  const type = v.productType as ProductType;

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => setV((p) => ({ ...p, [key]: value }));

  function submit(intent: "draft" | "publish" | "save") {
    const fd = new FormData();
    fd.set("payload", JSON.stringify(v));
    fd.set("intent", intent);
    startTransition(() => action(fd));
  }

  async function runConfirm() {
    if (!v.id || !confirm) return;
    setConfirmBusy(true);
    setConfirmError("");
    if (confirm === "archive") {
      await archiveProduct(v.id);
    } else {
      const res = await deleteProduct(v.id);
      if (res && !res.ok) setConfirmError(res.message);
    }
    setConfirmBusy(false);
  }

  const err = (k: keyof ProductFormValues) => errors[k];

  async function suggestSku() {
    if (v.name.trim().length < 2) return setSkuHint("Enter the product name first.");
    setSkuBusy(true);
    setSkuHint("");
    try {
      const sku = await generateSku({ name: v.name, productType: v.productType, capacityMl: v.capacityMl, productId: v.id });
      set("sku", sku);
      setSkuHint(v.productType ? "Generated. You can edit it." : "Tip: choose a product type for a more specific code.");
    } catch {
      setSkuHint("Couldn't generate a SKU. Please type one.");
    } finally {
      setSkuBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(v.status === "active" ? "publish" : "draft");
      }}
      noValidate
      className="grid gap-6 xl:grid-cols-[1fr_320px]"
    >
      <div className="space-y-6">
        {state.status === "error" && (
          <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle className="size-4" /> {state.message}
          </p>
        )}

        <Section title="Basic information">
          <Field label="Product name" error={err("name")} className="sm:col-span-2">
            <input
              className={field}
              value={v.name}
              aria-invalid={!!err("name")}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="URL name" hint={`/products/${v.slug || "…"}`} error={err("slug")}>
            <input className={field} value={v.slug} aria-invalid={!!err("slug")} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
          </Field>
          <div>
            <label htmlFor="sku" className="mb-1.5 block text-sm font-bold">SKU</label>
            <div className="flex gap-2">
              <input
                id="sku"
                className={cn(field, "uppercase")}
                value={v.sku}
                aria-invalid={!!err("sku")}
                aria-describedby="sku-help"
                onChange={(e) => set("sku", e.target.value.toUpperCase())}
                placeholder="e.g. KA-BOT-260"
              />
              <button type="button" onClick={suggestSku} disabled={skuBusy} className={cn(btn.secondary, "shrink-0 px-3")}>
                {skuBusy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />} Generate
              </button>
            </div>
            <span id="sku-help" role={err("sku") ? "alert" : undefined} className={cn("mt-1 block text-xs", err("sku") ? "font-semibold text-red-600" : "text-ink/50")}>
              {err("sku") ?? (skuHint || "Your internal product code. Must be unique.")}
            </span>
          </div>
          <Field label="Category" error={err("categoryId")}>
            <select className={field} value={v.categoryId} aria-invalid={!!err("categoryId")} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Choose a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Product type" hint="Decides which details are shown below" error={err("productType")}>
            <select className={field} value={v.productType} aria-invalid={!!err("productType")} onChange={(e) => set("productType", e.target.value)}>
              <option value="">Choose a type</option>
              {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Description" error={err("description")} className="sm:col-span-2">
            <textarea className={cn(field, "h-32 py-2")} value={v.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </Section>

        <Section title="Product details" description="Leave anything that doesn't apply blank.">
          <Field label="Age suitability" hint="e.g. 6m+, 2y+">
            <input className={field} value={v.ageRange} onChange={(e) => set("ageRange", e.target.value)} />
          </Field>
          <Field label="Material">
            <input className={field} value={v.material} onChange={(e) => set("material", e.target.value)} placeholder="e.g. Food-grade silicone" />
          </Field>
          {SHOWS_CAPACITY.includes(type) && (
            <Field label="Capacity (ml)" error={err("capacityMl")}>
              <input className={field} inputMode="numeric" value={v.capacityMl} aria-invalid={!!err("capacityMl")} onChange={(e) => set("capacityMl", e.target.value)} />
            </Field>
          )}
          {SHOWS_DIMENSIONS.includes(type) && (
            <Field label="Dimensions" hint="e.g. 20cm × 18cm">
              <input className={field} value={v.dimensions} onChange={(e) => set("dimensions", e.target.value)} />
            </Field>
          )}
          {SHOWS_PIECES.includes(type) && (
            <Field label="Number of pieces" error={err("pieceCount")}>
              <input className={field} inputMode="numeric" value={v.pieceCount} aria-invalid={!!err("pieceCount")} onChange={(e) => set("pieceCount", e.target.value)} />
            </Field>
          )}
          <Field label="Cleaning & care instructions" className="sm:col-span-2">
            <textarea className={cn(field, "h-20 py-2")} value={v.careInstructions} onChange={(e) => set("careInstructions", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-bold">Colour & other specifications</p>
            <div className="space-y-2">
              {v.specs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input className={field} value={s.label} placeholder="Label, e.g. Colour" aria-label={`Specification ${i + 1} label`} onChange={(e) => set("specs", v.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <input className={field} value={s.value} placeholder="Value, e.g. Dusty rose" aria-label={`Specification ${i + 1} value`} onChange={(e) => set("specs", v.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                  <button type="button" onClick={() => set("specs", v.specs.filter((_, j) => j !== i))} aria-label={`Remove specification ${i + 1}`} className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-ink/5">
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => set("specs", [...v.specs, { label: "", value: "" }])} className={btn.ghost}>
                <Plus className="size-4" /> Add specification
              </button>
            </div>
          </div>
        </Section>

        <Section title="Product media" description="The primary image is shown on product cards.">
          <div className="sm:col-span-2">
            <ImageUploader images={v.images} onChange={(images) => set("images", images)} error={err("images")} />
          </div>
        </Section>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Section title="Publishing">
          <div className="sm:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink/60">Status</span>
              <StatusBadge status={v.status} />
            </div>
            <Toggle label="Featured on homepage" checked={v.isFeatured} onChange={(c) => set("isFeatured", c)} />
            <Toggle label="Show “New” badge" checked={v.isNew} onChange={(c) => set("isNew", c)} />
            <div className="grid gap-2 pt-2">
              <button type="button" disabled={pending} onClick={() => submit("publish")} className={btn.primary}>
                {pending ? "Saving…" : v.status === "active" ? "Save & keep published" : "Publish product"}
              </button>
              <button type="button" disabled={pending} onClick={() => submit("draft")} className={btn.secondary}>
                {v.status === "active" ? "Unpublish (save as draft)" : "Save as draft"}
              </button>
              {v.id && v.status === "active" && (
                <Link href={`/products/${initial.slug}`} target="_blank" className={btn.ghost}><Eye className="size-4" /> View in shop</Link>
              )}
            </div>
          </div>
        </Section>

        <Section title="Pricing">
          <Field label="Selling price (₦)" error={err("price")} className="sm:col-span-2">
            <input className={field} inputMode="decimal" value={v.price} aria-invalid={!!err("price")} onChange={(e) => set("price", e.target.value)} placeholder="12500" />
          </Field>
          <Field label="Discount price (₦)" hint="Optional. Must be lower than the selling price." error={err("salePrice")} className="sm:col-span-2">
            <input className={field} inputMode="decimal" value={v.salePrice} aria-invalid={!!err("salePrice")} onChange={(e) => set("salePrice", e.target.value)} />
          </Field>
          <p className="text-xs text-ink/50 sm:col-span-2">Currency: Nigerian Naira (NGN)</p>
        </Section>

        <Section title="Inventory">
          <div className="sm:col-span-2">
            <Toggle label="Track stock for this product" checked={v.trackInventory} onChange={(c) => set("trackInventory", c)} />
          </div>
          {v.trackInventory && (
            <>
              <Field label="Stock quantity" error={err("stock")} hint={v.id ? "Changes are logged as stock adjustments" : undefined}>
                <input className={field} inputMode="numeric" value={v.stock} aria-invalid={!!err("stock")} onChange={(e) => set("stock", e.target.value)} />
              </Field>
              <Field label="Low-stock alert at" error={err("lowStockThreshold")}>
                <input className={field} inputMode="numeric" value={v.lowStockThreshold} aria-invalid={!!err("lowStockThreshold")} onChange={(e) => set("lowStockThreshold", e.target.value)} />
              </Field>
            </>
          )}
        </Section>

        {v.id && (
          <Section title="Danger zone">
            <div className="sm:col-span-2 grid gap-2">
              {v.status !== "archived" && (
                <button type="button" onClick={() => setConfirm("archive")} className={btn.secondary}><Archive className="size-4" /> Archive product</button>
              )}
              <button type="button" onClick={() => setConfirm("delete")} className={cn(btn.secondary, "text-red-600")}><Trash2 className="size-4" /> Delete permanently</button>
              <p className="text-xs text-ink/50">Archiving hides the product but keeps it for order history. Products that appear in orders can&apos;t be deleted.</p>
            </div>
          </Section>
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "delete" ? "Delete this product?" : "Archive this product?"}
        message={
          confirm === "delete"
            ? `“${v.name}” will be removed permanently, including its images and stock record. This can't be undone.`
            : `“${v.name}” will be hidden from the shop. You can publish it again later.`
        }
        confirmLabel={confirm === "delete" ? "Delete product" : "Archive product"}
        tone={confirm === "delete" ? "danger" : "primary"}
        busy={confirmBusy}
        error={confirmError}
        onConfirm={runConfirm}
        onCancel={() => { setConfirm(null); setConfirmError(""); }}
      />
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-5 py-3.5">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ink/50">{description}</p>}
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, hint, error, className, children }: { label: string; hint?: string; error?: string; className?: string; children: React.ReactElement }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink/50">{hint}</span>
      ) : null}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
      {label}
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-ink/20 transition-colors peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-brand/20 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}
