"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

type Tile =
  | { kind: "photo"; src: string; alt: string; caption: string; href: string; position?: string; className: string }
  | { kind: "label"; title: string; subtitle: string; href: string; color: string; ring: string; className: string };

/**
 * Bento grid of collections. Lifestyle photography only: none of these
 * images repeat the hero or the product grid. Desktop is an 8-column,
 * 4-row grid; on mobile it collapses to two dense columns.
 */
const TILES: Tile[] = [
  {
    kind: "photo",
    src: "/images/collections/girl-shape-sorter-house.jpg",
    alt: "A young girl playing with a colourful shape-sorting house",
    caption: "Learning through play",
    href: "/shop?category=educational-toys",
    position: "object-[50%_60%]",
    className: "col-span-2 row-span-2 lg:col-span-3 lg:row-span-3",
  },
  {
    kind: "label",
    title: "Discounts",
    subtitle: "Little prices",
    href: "/shop?on_sale=true",
    color: "bg-[#2E3A87]",
    ring: "stroke-white/10",
    className: "lg:col-span-2",
  },
  {
    kind: "photo",
    src: "/images/collections/bear-feeding-gift-set.jpg",
    alt: "Bear-themed silicone feeding set with a gift box",
    caption: "Mealtime gift sets",
    href: "/shop?category=feeding-plates-bowls",
    position: "object-[50%_62%]",
    className: "col-span-2 lg:col-span-3",
  },
  {
    kind: "photo",
    src: "/images/collections/boy-blowing-bubbles.jpg",
    alt: "A smiling boy in sunglasses blowing bubbles",
    caption: "Playful finds",
    href: "/shop",
    position: "object-[50%_22%]",
    className: "row-span-2 lg:col-span-3 lg:row-span-2",
  },
  {
    kind: "label",
    title: "Best Sellers",
    subtitle: "Parent favourites",
    href: "/shop?sort=popular",
    color: "bg-[#D6336C]",
    ring: "stroke-white/15",
    className: "lg:col-span-2",
  },
  {
    kind: "photo",
    src: "/images/collections/girl-ball-pit.jpg",
    alt: "A laughing girl lying in a ball pit of pastel balls",
    caption: "Fun & games",
    href: "/shop?category=puzzles-games",
    position: "object-[50%_30%]",
    className: "row-span-2 lg:col-span-2 lg:row-span-2",
  },
  {
    kind: "label",
    title: "New Arrivals",
    subtitle: "Just landed",
    href: "/shop?sort=newest",
    color: "bg-[#3E8E41]",
    ring: "stroke-white/15",
    className: "lg:col-span-2",
  },
  {
    kind: "photo",
    src: "/images/collections/baby-bath-time.jpg",
    alt: "A baby sitting in an inflatable bath tub filled with balls",
    caption: "Bath time",
    href: "/shop?category=other-kids-accessories",
    position: "object-[50%_50%]",
    className: "col-span-2 lg:col-span-2",
  },
  {
    kind: "label",
    title: "Mealtime",
    subtitle: "Plates, bibs & more",
    href: "/shop?category=feeding-plates-bowls",
    color: "bg-[#D9532F]",
    ring: "stroke-white/15",
    className: "lg:col-span-2",
  },
];

export function CollectionsBento() {
  return (
    <section aria-labelledby="collections-heading" className="relative overflow-hidden bg-[#FDF8E9] pb-6 pt-20 sm:pb-8 sm:pt-24">
      <ArcDoodle className="absolute -top-2 right-[6%] w-24 text-[#3C46C8] sm:w-32" rotate={0} />
      <ArcDoodle className="absolute bottom-0 left-[3%] w-20 text-[#D6336C] sm:w-28" rotate={180} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading id="collections-heading" eyebrow="Explore More" title="Shop the Collections" />

        <div className="mt-10 grid grid-flow-row-dense auto-rows-[118px] grid-cols-2 gap-3.5 sm:auto-rows-[150px] sm:gap-5 lg:auto-rows-[132px] lg:grid-cols-8 lg:gap-6">
          {TILES.map((tile, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", stiffness: 110, damping: 16, delay: i * 0.06 }}
              className={tile.className}
            >
              {tile.kind === "label" ? <LabelTile tile={tile} /> : <PhotoTile tile={tile} />}
            </motion.div>
          ))}
        </div>
      </div>

    </section>
  );
}

function PhotoTile({ tile }: { tile: Extract<Tile, { kind: "photo" }> }) {
  return (
    <Link
      href={tile.href}
      className={cn(
        "group relative block size-full overflow-hidden rounded-[22px] outline-none focus-visible:ring-4 focus-visible:ring-sunny",
        "bg-ink/5",
      )}
    >
      <Image
        src={tile.src}
        alt={tile.alt}
        fill
        sizes="(min-width: 1024px) 420px, 50vw"
        className={cn(
          "object-cover transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-110",
          tile.position,
        )}
      />
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="absolute bottom-3 left-3 flex translate-y-3 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 sm:text-sm">
        {tile.caption}
        <ArrowUpRight className="size-3.5" />
      </span>
    </Link>
  );
}

function LabelTile({ tile }: { tile: Extract<Tile, { kind: "label" }> }) {
  return (
    <Link
      href={tile.href}
      className={cn(
        "group relative flex size-full flex-col items-center justify-center overflow-hidden rounded-[22px] text-center text-white outline-none focus-visible:ring-4 focus-visible:ring-sunny",
        tile.color,
      )}
    >
      {/* Faint looping rings, like the reference, that spin on hover */}
      <svg
        viewBox="0 0 200 120"
        className="absolute inset-0 size-full transition-transform duration-700 ease-out group-hover:rotate-12 group-hover:scale-125"
        aria-hidden="true"
      >
        <circle cx="150" cy="40" r="70" fill="none" strokeWidth="18" className={tile.ring} />
        <circle cx="40" cy="120" r="45" fill="none" strokeWidth="14" className={tile.ring} />
      </svg>
      <span className="relative font-display text-xl font-semibold sm:text-2xl">{tile.title}</span>
      <span className="relative mt-0.5 text-xs font-semibold text-white/75 sm:text-sm">{tile.subtitle}</span>
      <span className="absolute right-3 top-3 grid size-8 scale-0 place-items-center rounded-full bg-white/20 transition-transform duration-300 group-hover:scale-100">
        <ArrowUpRight className="size-4" />
      </span>
    </Link>
  );
}

function ArcDoodle({ className, rotate }: { className: string; rotate: number }) {
  return (
    <svg viewBox="0 0 100 70" className={className} style={{ rotate: `${rotate}deg` }} aria-hidden="true">
      <motion.path
        d="M10 62 C40 60 78 40 90 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="butt"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  );
}
