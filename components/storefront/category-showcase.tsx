"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "motion/react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { CategoryWithCount } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { ACCENT_STYLES, CategoryIcon } from "./category-icon";
import { SectionHeading } from "./section-heading";

export function CategoryShowcase({ categories }: { categories: CategoryWithCount[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on("select", sync).on("reInit", sync).on("scroll", sync);
    queueMicrotask(sync);
    return () => {
      embla.off("select", sync).off("reInit", sync).off("scroll", sync);
    };
  }, [embla, sync]);

  return (
    <section aria-labelledby="categories-heading" id="categories" className="relative bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="categories-heading"
          eyebrow="Shop by Category"
          title="Find the Right Accessories"
          action={{ href: "/shop", label: "View all products" }}
        />
      </div>

      <div className="relative mx-auto mt-10 max-w-6xl sm:mt-12">
        <div ref={emblaRef} className="overflow-hidden px-4 sm:px-6">
          <ul className="-ml-4 flex touch-pan-y py-3 sm:-ml-5">
            {categories.map((category, i) => (
              <li
                key={category.id}
                className="min-w-0 shrink-0 basis-[62%] pl-4 sm:basis-[36%] sm:pl-5 md:basis-[28%] lg:basis-[22.5%]"
              >
                <CategoryCard category={category} index={i} />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 sm:hidden">
          <CarouselButton direction="prev" disabled={!canPrev} onClick={() => embla?.scrollPrev()} />
          <CarouselButton direction="next" disabled={!canNext} onClick={() => embla?.scrollNext()} />
        </div>
        {/* Desktop arrows float over the edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between sm:flex">
          <div className="pointer-events-auto -translate-x-1/2 pl-6 lg:pl-0">
            <CarouselButton direction="prev" disabled={!canPrev} onClick={() => embla?.scrollPrev()} />
          </div>
          <div className="pointer-events-auto translate-x-1/2 pr-6 lg:pr-0">
            <CarouselButton direction="next" disabled={!canNext} onClick={() => embla?.scrollNext()} />
          </div>
        </div>
      </div>
    </section>
  );
}

function CarouselButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous categories" : "Next categories"}
      animate={{ opacity: disabled ? 0 : 1, scale: disabled ? 0.8 : 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "grid size-11 place-items-center rounded-full bg-white text-ink shadow-[0_6px_20px_-6px_rgba(0,0,0,0.25)] ring-1 ring-black/5",
        disabled && "pointer-events-none",
      )}
    >
      <Icon className="size-5" />
    </motion.button>
  );
}

function CategoryCard({ category, index }: { category: CategoryWithCount; index: number }) {
  const accent = ACCENT_STYLES[category.accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 110, damping: 15, delay: Math.min(index, 5) * 0.07 }}
    >
      <Link href={`/shop?category=${category.slug}`} className="group block outline-none">
        <motion.div
          whileHover="hover"
          initial="rest"
          animate="rest"
          className="relative aspect-[198/230] overflow-hidden rounded-[28px] bg-[#F5F6F8] transition-shadow duration-300 group-hover:shadow-[0_18px_40px_-18px_rgba(8,111,84,0.45)] group-focus-visible:ring-4 group-focus-visible:ring-sunny"
        >
          {/* Accent wash grows from the centre on hover */}
          <motion.div
            variants={{ rest: { scale: 0, opacity: 0 }, hover: { scale: 1.6, opacity: 1 } }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className={cn("absolute inset-0 m-auto size-full rounded-full", accent.bg)}
          />

          <motion.div
            variants={{ rest: { scale: 1, rotate: 0, y: 0 }, hover: { scale: 1.08, rotate: -3, y: -6 } }}
            transition={{ type: "spring", stiffness: 220, damping: 14 }}
            // Blend on the animated wrapper: its transform creates a stacking
            // context, so a blend on the image alone would see no backdrop.
            className="absolute inset-0 mix-blend-multiply"
          >
            {category.image ? (
              <Image
                src={category.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 250px, (min-width: 640px) 33vw, 60vw"
                className="object-contain p-[12%]"
              />
            ) : (
              <div className="grid size-full place-items-center">
                <div className={cn("grid size-24 place-items-center rounded-full sm:size-28", accent.bg)}>
                  <CategoryIcon icon={category.icon} className={cn("size-12 sm:size-14", accent.ink)} strokeWidth={1.5} />
                </div>
              </div>
            )}
          </motion.div>

          <motion.span
            variants={{ rest: { scale: 0, rotate: -45 }, hover: { scale: 1, rotate: 0 } }}
            transition={{ type: "spring", stiffness: 300, damping: 16 }}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-ink text-white"
          >
            <ArrowUpRight className="size-4" />
          </motion.span>
        </motion.div>

        <div className="mt-4 px-1">
          <h3 className="text-[15px] font-bold leading-snug text-ink transition-colors group-hover:text-brand">
            {category.name}
          </h3>
          <p className="mt-0.5 text-sm text-ink/55">
            {category.productCount} {category.productCount === 1 ? "product" : "products"}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
