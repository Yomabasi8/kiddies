"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { ProductFormImage } from "@/lib/admin/product-types";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

/**
 * Uploads straight to the `product-images` bucket with the signed-in staff
 * member's session. The bucket itself enforces staff-only writes, image
 * types and a 5 MB limit; these checks just give faster feedback.
 */
export function ImageUploader({ images, onChange, error }: { images: ProductFormImage[]; onChange: (next: ProductFormImage[]) => void; error?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [problem, setProblem] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setProblem("");
    const supabase = createBrowserSupabase();
    const added: ProductFormImage[] = [];
    setBusy(files.length);
    for (const file of Array.from(files)) {
      if (!TYPES.includes(file.type)) {
        setProblem(`${file.name}: please use JPG, PNG, WebP or AVIF.`);
      } else if (file.size > MAX_BYTES) {
        setProblem(`${file.name} is larger than 5 MB.`);
      } else {
        const path = `products/${crypto.randomUUID()}.${EXT[file.type]}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
        if (error) setProblem(`${file.name}: upload failed (${error.message}).`);
        else {
          const { data } = supabase.storage.from("product-images").getPublicUrl(path);
          added.push({ url: data.publicUrl, alt: "", style: "cutout", isPrimary: false });
        }
      }
      setBusy((b) => b - 1);
    }
    const next = [...images, ...added];
    if (!next.some((i) => i.isPrimary) && next[0]) next[0] = { ...next[0], isPrimary: true };
    onChange(next);
    if (input.current) input.current.value = "";
  }

  function update(i: number, patch: Partial<ProductFormImage>) {
    onChange(images.map((img, j) => (j === i ? { ...img, ...patch } : patch.isPrimary ? { ...img, isPrimary: false } : img)));
  }

  function remove(i: number) {
    const next = images.filter((_, j) => j !== i);
    if (images[i].isPrimary && next[0]) next[0] = { ...next[0], isPrimary: true };
    onChange(next);
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, i) => (
          <div key={img.url} className={cn("overflow-hidden rounded-xl border bg-white", img.isPrimary ? "border-brand ring-2 ring-brand/30" : "border-ink/10")}>
            <div className="relative aspect-square bg-[#F5F6F8]">
              <Image src={img.url} alt={img.alt || "Product image"} fill sizes="240px" className={img.style === "photo" ? "object-cover" : "object-contain p-3 mix-blend-multiply"} />
              {img.isPrimary && <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">Primary</span>}
            </div>
            <div className="space-y-2 p-3">
              <input
                value={img.alt}
                onChange={(e) => update(i, { alt: e.target.value })}
                placeholder="Describe the image (alt text)"
                aria-label={`Alt text for image ${i + 1}`}
                className="h-9 w-full rounded-lg border border-ink/15 px-2.5 text-xs outline-none focus:border-brand"
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={img.style}
                  onChange={(e) => update(i, { style: e.target.value as "cutout" | "photo" })}
                  aria-label={`Display style for image ${i + 1}`}
                  className="h-8 rounded-lg border border-ink/15 bg-white px-2 text-xs"
                >
                  <option value="cutout">White background</option>
                  <option value="photo">Full photo</option>
                </select>
                <div className="flex gap-1">
                  {!img.isPrimary && (
                    <button type="button" onClick={() => update(i, { isPrimary: true })} title="Make primary" aria-label={`Make image ${i + 1} the primary image`} className="grid size-8 place-items-center rounded-lg hover:bg-ink/5">
                      <Star className="size-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => remove(i)} title="Remove" aria-label={`Remove image ${i + 1}`} className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy > 0}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/20 bg-white text-sm font-semibold text-ink/60 transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
        >
          {busy > 0 ? <Loader2 className="size-7 animate-spin" /> : <ImagePlus className="size-7" />}
          {busy > 0 ? `Uploading ${busy}…` : "Upload images"}
          <span className="text-xs font-normal text-ink/45">JPG, PNG, WebP · max 5 MB</span>
        </button>
      </div>
      <input ref={input} type="file" accept={TYPES.join(",")} multiple hidden onChange={(e) => upload(e.target.files)} />
      {(problem || error) && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{problem || error}</p>}
    </div>
  );
}
