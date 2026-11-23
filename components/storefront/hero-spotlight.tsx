"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Category, Product } from "@/lib/catalog/types";
import { discountPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductVisual } from "./product-visual";

const AUTOPLAY_MS = 5000;

type Props = { products: Product[]; categories: Category[] };

/**
 * Hero product spotlight: one featured product at a time on a chunky
 * "toy box" card, with yellow arrow buttons, autoplay progress and a real
 * add-to-cart.
 */
export function HeroSpotlight({ products, categories }: Props) {
  const [[index, direction], setPage] = useState<[number, number]>([0, 1]);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const visualRef = useRef<HTMLDivElement>(null);
  const byId = new Map(categories.map((c) => [c.id, c]));

  const count = products.length;
  const go = useCallback(
    (dir: number) => setPage(([i]) => [(i + dir + count) % count, dir]),
    [count],
  );

  useEffect(() => {
    if (paused || reduceMotion || count < 2) return;
    const t = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduceMotion, count, go]);

  if (count === 0) return null;
  const product = products[index];
  const category = byId.get(product.categoryId);
  if (!category) return null;
  const onSale = product.salePrice !== null && product.salePrice < product.price;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured products"
    >
      <ArrowButton direction="prev" onClick={() => go(-1)} className="absolute -left-7 top-1/2 z-10 hidden -translate-y-1/2 md:grid" />
      <ArrowButton direction="next" onClick={() => go(1)} className="absolute -right-7 top-1/2 z-10 hidden -translate-y-1/2 md:grid" />

      <div className="relative overflow-hidden rounded-[32px] border-[3px] border-ink bg-white shadow-[0_8px_0_0_#1b1b1b]">
        <div className="grid sm:grid-cols-[1.05fr_1fr]">
          {/* Product art */}
          <div ref={visualRef} className="relative aspect-[4/3] overflow-hidden sm:aspect-auto sm:min-h-[260px]">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={product.id}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ x: `${d * 100}%`, rotate: d * 12, opacity: 0 }),
                  center: { x: 0, rotate: 0, opacity: 1 },
                  exit: (d: number) => ({ x: `${d * -100}%`, rotate: d * -12, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 160, damping: 20 }}
                className="absolute inset-0"
              >
                <ProductVisual
                  image={product.image}
                  imageStyle={product.imageStyle}
                  alt={product.name}
                  accent={category.accent}
                  icon={category.icon}
                  sizes="(min-width: 640px) 360px, 90vw"
                  className="size-full"
                />
              </motion.div>
            </AnimatePresence>
            {onSale && (
              <span className="absolute left-4 top-4 z-10 rounded-full bg-coral px-3 py-1 text-xs font-extrabold text-white">
                -{discountPercent(product.price, product.salePrice!)}%
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center gap-1 border-t-[3px] border-ink p-6 sm:border-l-[3px] sm:border-t-0 sm:p-8" aria-live="polite">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider">
              <span className="text-coral">Little favourites</span>
              <span className="tabular-nums text-ink/40">
                {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink sm:text-[1.7rem]">
                  {product.name}
                </h2>
                <p className="mt-1 text-sm font-semibold text-ink/50">{category.name}</p>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className={cn("text-2xl font-extrabold", onSale ? "text-coral" : "text-ink")}>
                    {formatPrice(onSale ? product.salePrice! : product.price)}
                  </span>
                  {onSale && (
                    <span className="text-sm text-ink/40 line-through">
                      <span className="sr-only">Was </span>
                      {formatPrice(product.price)}
                    </span>
                  )}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <AddToCartButton product={product} sourceRef={visualRef} className="h-11 px-5" />
              <Link
                href={`/products/${product.slug}`}
                className="group inline-flex items-center gap-1 text-sm font-bold text-ink/70 hover:text-brand"
              >
                View details
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Dots double as an autoplay progress bar */}
            <div className="mt-6 flex gap-1.5" role="tablist" aria-label="Choose product">
              {products.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show ${p.name}`}
                  onClick={() => setPage([i, i > index ? 1 : -1])}
                  className={cn(
                    "relative h-2 overflow-hidden rounded-full bg-ink/10 transition-[width] duration-300",
                    i === index ? "w-10" : "w-2 hover:bg-ink/25",
                  )}
                >
                  {i === index && (
                    <motion.span
                      key={`${index}-${paused}`}
                      className="absolute inset-y-0 left-0 bg-brand"
                      initial={{ width: paused || reduceMotion ? "100%" : "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: paused || reduceMotion ? 0 : AUTOPLAY_MS / 1000, ease: "linear" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile arrows */}
      <div className="mt-5 flex justify-center gap-4 md:hidden">
        <ArrowButton direction="prev" onClick={() => go(-1)} className="grid" />
        <ArrowButton direction="next" onClick={() => go(1)} className="grid" />
      </div>
    </div>
  );
}

function ArrowButton({
  direction,
  onClick,
  className,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  className?: string;
}) {
  const Icon = direction === "prev" ? ArrowLeft : ArrowRight;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous product" : "Next product"}
      whileHover={{ scale: 1.08, x: direction === "prev" ? -4 : 4 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "size-14 place-items-center rounded-full border-[3px] border-ink bg-sunny text-ink shadow-[0_4px_0_0_#1b1b1b] lg:size-[72px]",
        className,
      )}
    >
      <Icon className="size-6 lg:size-7" strokeWidth={2.5} />
    </motion.button>
  );
}
