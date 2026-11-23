"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion } from "motion/react";
import type { Category, Product } from "@/lib/catalog/types";
import { discountPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductVisual } from "./product-visual";

const LOW_STOCK = 5;

export function ProductCard({ product, category }: { product: Product; category: Category }) {
  const visualRef = useRef<HTMLDivElement>(null);
  const href = `/products/${product.slug}`;
  const onSale = product.salePrice !== null && product.salePrice < product.price;
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= LOW_STOCK;

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group flex h-full flex-col"
    >
      <Link href={href} className="relative block rounded-[24px] outline-none focus-visible:ring-4 focus-visible:ring-sunny">
        <div ref={visualRef}>
          <ProductVisual
            image={product.image}
            imageStyle={product.imageStyle}
            alt={product.name}
            accent={category.accent}
            icon={category.icon}
            sizes="(min-width: 1024px) 270px, (min-width: 768px) 30vw, 46vw"
            className={cn(
              "aspect-square rounded-[24px] transition-shadow duration-300 group-hover:shadow-[0_20px_40px_-20px_rgba(27,27,27,0.35)]",
              soldOut && "opacity-60 grayscale-[40%]",
            )}
            imageClassName="transition-transform duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:scale-110 group-hover:-rotate-3"
          />
        </div>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {onSale && (
            <span className="rounded-full bg-coral px-2.5 py-1 text-xs font-extrabold text-white">
              -{discountPercent(product.price, product.salePrice!)}%
            </span>
          )}
          {product.isNew && (
            <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-extrabold text-white">New</span>
          )}
        </div>
        {soldOut && (
          <span className="absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
            Sold out
          </span>
        )}
      </Link>

      <div className="mt-3.5 flex flex-1 flex-col px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">{category.name}</p>
        <h3 className="mt-1 text-[15px] font-bold leading-snug text-ink sm:text-base">
          <Link href={href} className="transition-colors hover:text-brand">
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {product.ageRange && (
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-brand">Ages {product.ageRange}</span>
          )}
          {lowStock && (
            <span className="rounded-full bg-[#FFF1D6] px-2 py-0.5 text-[#9A6400]">Only {product.stock} left</span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="leading-tight">
            <span className={cn("block text-lg font-extrabold", onSale ? "text-coral" : "text-ink")}>
              {formatPrice(onSale ? product.salePrice! : product.price)}
            </span>
            {onSale && (
              <span className="text-sm text-ink/45 line-through">
                <span className="sr-only">Was </span>
                {formatPrice(product.price)}
              </span>
            )}
          </p>
          <AddToCartButton product={product} sourceRef={visualRef} />
        </div>
      </div>
    </motion.article>
  );
}
