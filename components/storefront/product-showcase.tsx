"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { Category, Product } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";
import { SectionHeading } from "./section-heading";

/** Homepage filter groups, keyed by category slug. */
const FILTERS = [
  { key: "all", label: "All", slugs: null },
  { key: "feeding", label: "Feeding", slugs: ["feeding-plates-bowls", "spoons-forks-cutlery", "bibs-mealtime", "lunch-boxes-containers"] },
  { key: "drinkware", label: "Bottles & Cups", slugs: ["feeding-bottles", "cups-water-bottles"] },
  { key: "toys", label: "Toys & Play", slugs: ["educational-toys", "puzzles-games", "other-kids-accessories"] },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export function ProductShowcase({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const visible = useMemo(() => {
    const slugs = FILTERS.find((f) => f.key === filter)?.slugs as readonly string[] | null | undefined;
    return slugs ? products.filter((p) => slugs.includes(byId.get(p.categoryId)?.slug ?? "")) : products;
  }, [filter, products, byId]);

  return (
    <section aria-labelledby="products-heading" className="relative bg-white pb-20 pt-10 sm:pb-28 sm:pt-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading id="products-heading" eyebrow="Our Products" title="Handpicked for Little Ones" />

        {/* Filter chips with a sliding highlight */}
        <div role="group" aria-label="Filter products" className="-mx-4 mt-7 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2 rounded-full bg-[#F5F6F8] p-1.5">
            {FILTERS.map((f) => {
              const active = f.key === filter;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={active}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-bold transition-colors sm:px-5",
                    active ? "text-white" : "text-ink/70 hover:text-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="product-filter-pill"
                      className="absolute inset-0 rounded-full bg-brand"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <motion.ul layout className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((product, i) => {
              const category = byId.get(product.categoryId);
              if (!category) return null;
              return (
                <motion.li
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 140, damping: 18, delay: (i % 4) * 0.06 }}
                >
                  <ProductCard product={product} category={category} />
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>

        <div className="mt-14 flex justify-center">
          <motion.div whileHover={{ y: -3 }} whileTap={{ y: 4 }}>
            <Link
              href="/shop"
              className="group inline-flex h-12 items-center gap-2 rounded-xl border-2 border-ink px-7 text-[15px] font-bold text-ink shadow-pop transition-colors hover:bg-ink hover:text-white"
            >
              Browse the full shop
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
