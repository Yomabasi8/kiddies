"use client";

import { motion } from "motion/react";
import type { Category, Product } from "@/lib/catalog/types";
import { ProductCard } from "@/components/storefront/product-card";

/** Animated responsive grid of product cards. */
export function ProductGrid({
  products,
  categories,
  columns = "lg:grid-cols-3",
}: {
  products: Product[];
  categories: Category[];
  columns?: string;
}) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return (
    <ul className={`grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-3 ${columns}`}>
      {products.map((p, i) => {
        const category = byId.get(p.categoryId);
        if (!category) return null;
        return (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 140, damping: 18, delay: Math.min(i, 8) * 0.04 }}
          >
            <ProductCard product={p} category={category} />
          </motion.li>
        );
      })}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="animate-pulse">
          <div className="aspect-square rounded-[24px] bg-ink/[0.06]" />
          <div className="mt-4 h-3 w-1/3 rounded-full bg-ink/[0.06]" />
          <div className="mt-2 h-4 w-3/4 rounded-full bg-ink/[0.08]" />
          <div className="mt-5 h-9 w-full rounded-full bg-ink/[0.06]" />
        </li>
      ))}
    </ul>
  );
}
