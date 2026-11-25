"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Package, Plus, ShieldCheck, Sparkles } from "lucide-react";
import type { Category, ProductDetail } from "@/lib/catalog/types";
import { discountPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductVisual } from "@/components/storefront/product-visual";
import { useFreeDeliveryOffer } from "@/components/storefront/offer-context";

const LOW_STOCK = 5;

export function ProductDetailView({ product, category }: { product: ProductDetail; category: Category }) {
  const images = [
    ...(product.image ? [{ src: product.image, alt: product.name, style: product.imageStyle }] : []),
    ...product.gallery,
  ];
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const offer = useFreeDeliveryOffer();
  const visualRef = useRef<HTMLDivElement>(null);

  const onSale = product.salePrice !== null && product.salePrice < product.price;
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= LOW_STOCK;
  const current = images[active];

  const specs = [
    ...(product.ageRange ? [{ label: "Age", value: product.ageRange }] : []),
    ...(product.material ? [{ label: "Material", value: product.material }] : []),
    ...product.specs,
    { label: "SKU", value: product.sku },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
      {/* Gallery */}
      <div>
        <div ref={visualRef} className="relative overflow-hidden rounded-[32px] border-[3px] border-ink shadow-[0_8px_0_0_#1b1b1b]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={current?.src ?? "placeholder"}
              initial={{ opacity: 0, scale: 0.96, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ type: "spring", stiffness: 180, damping: 20 }}
            >
              <ProductVisual
                image={current?.src ?? null}
                imageStyle={current?.style}
                alt={current?.alt ?? product.name}
                accent={category.accent}
                icon={category.icon}
                sizes="(min-width: 1024px) 560px, 92vw"
                className="aspect-square"
              />
            </motion.div>
          </AnimatePresence>
          {onSale && (
            <span className="absolute left-5 top-5 rounded-full bg-coral px-3 py-1.5 text-sm font-extrabold text-white">
              -{discountPercent(product.price, product.salePrice!)}%
            </span>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-4 flex gap-3" role="tablist" aria-label="Product images">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Show image ${i + 1}: ${img.alt}`}
                onClick={() => setActive(i)}
                className={cn(
                  "size-20 overflow-hidden rounded-2xl border-[3px] transition-all sm:size-24",
                  i === active ? "border-ink" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <ProductVisual image={img.src} imageStyle={img.style} alt="" accent={category.accent} icon={category.icon} sizes="96px" className="size-full" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col">
        <Link
          href={`/shop?category=${category.slug}`}
          className="w-fit rounded-full bg-brand-light px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-brand hover:bg-brand hover:text-white"
        >
          {category.name}
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-[2.6rem]">{product.name}</h1>

        <p className="mt-4 flex items-baseline gap-3">
          <span className={cn("text-3xl font-extrabold", onSale ? "text-coral" : "text-ink")}>
            {formatPrice(onSale ? product.salePrice! : product.price)}
          </span>
          {onSale && (
            <span className="text-lg text-ink/40 line-through">
              <span className="sr-only">Was </span>
              {formatPrice(product.price)}
            </span>
          )}
        </p>

        <p className={cn("mt-3 flex items-center gap-2 text-sm font-bold", soldOut ? "text-coral" : lowStock ? "text-[#9A6400]" : "text-brand")}>
          <span className={cn("size-2.5 rounded-full", soldOut ? "bg-coral" : lowStock ? "bg-[#F2B040]" : "bg-brand")} />
          {soldOut ? "Sold out" : lowStock ? `Only ${product.stock} left in stock` : "In stock"}
        </p>

        {product.description && <p className="mt-6 text-[15px] leading-relaxed text-ink/75">{product.description}</p>}

        {/* Quantity + add to cart */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center rounded-full border-2 border-ink/10 p-1" role="group" aria-label="Quantity">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={soldOut || qty <= 1}
              aria-label="Decrease quantity"
              className="grid size-10 place-items-center rounded-full hover:bg-[#F5F6F8] disabled:opacity-30"
            >
              <Minus className="size-4" />
            </button>
            <output aria-live="polite" className="w-10 text-center text-lg font-extrabold tabular-nums">
              {soldOut ? 0 : qty}
            </output>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              disabled={soldOut || qty >= product.stock}
              aria-label="Increase quantity"
              className="grid size-10 place-items-center rounded-full hover:bg-[#F5F6F8] disabled:opacity-30"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <AddToCartButton
            product={product}
            sourceRef={visualRef}
            quantity={qty}
            label="Add to cart"
            showLabel
            className="h-14 flex-1 px-8 text-base sm:flex-none"
          />
        </div>
        {!soldOut && qty >= product.stock && (
          <p className="mt-2 text-sm font-semibold text-[#9A6400]">That&apos;s all we have in stock right now.</p>
        )}

        {/* Specs */}
        <dl className="mt-10 divide-y-2 divide-ink/5 rounded-3xl bg-[#F5F6F8] px-6">
          {specs.map((s) => (
            <div key={s.label} className="flex justify-between gap-4 py-3.5 text-[15px]">
              <dt className="font-semibold text-ink/55">{s.label}</dt>
              <dd className="text-right font-bold text-ink">{s.value}</dd>
            </div>
          ))}
        </dl>

        {product.careInstructions && (
          <details className="group mt-4 rounded-3xl border-2 border-ink/10 px-6 py-4 open:bg-[#FDF8E9]">
            <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-semibold">
              Care instructions
              <Plus className="size-5 transition-transform group-open:rotate-45" aria-hidden="true" />
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/75">{product.careInstructions}</p>
          </details>
        )}

        <ul className="mt-8 grid gap-3 text-sm font-semibold text-ink/70 sm:grid-cols-3">
          <li className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand" /> Secure checkout
          </li>
          <li className="flex items-center gap-2">
            <Package className="size-5 text-brand" /> {offer.active ? "Free delivery in your first month" : "Delivery fee shown at checkout"}
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="size-5 text-brand" /> No account needed
          </li>
        </ul>
      </div>
    </div>
  );
}
