"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { Category, Product } from "@/lib/catalog/types";
import { HeroSpotlight } from "./hero-spotlight";
import { Mascot } from "./mascot";

const MotionLink = motion.create(Link);

/** Moves a layer with the pointer (depth in px) plus scroll parallax. */
function useParallax(
  mx: MotionValue<number>,
  my: MotionValue<number>,
  scroll: MotionValue<number>,
  depth: number,
  scrollDepth = 0,
) {
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform([my, scroll], ([py, s]: number[]) => py * depth + s * scrollDepth);
  return { x, y };
}

const spring = (delay: number) => ({ type: "spring" as const, stiffness: 170, damping: 14, delay });

/** A word that springs up into place. */
function Word({ children, delay, className }: { children: React.ReactNode; delay: number; className?: string }) {
  return (
    <motion.span
      className={`relative inline-block ${className ?? ""}`}
      initial={{ y: 60, rotate: 8, opacity: 0 }}
      animate={{ y: 0, rotate: 0, opacity: 1 }}
      whileHover={{ y: -6, rotate: -3 }}
      transition={spring(delay)}
    >
      {children}
    </motion.span>
  );
}

export function Hero({ products, categories }: { products: Product[]; categories: Category[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18 });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const scroll = useTransform(scrollYProgress, (v) => (reduceMotion ? 0 : v));

  const k = reduceMotion ? 0 : 1;
  const pinwheel = useParallax(mx, my, scroll, 30 * k, -60);
  const flower = useParallax(mx, my, scroll, -28 * k, -40);
  const leftCard = useParallax(mx, my, scroll, 16 * k, 60);
  const rightCard = useParallax(mx, my, scroll, -16 * k, 80);
  const dots = useParallax(mx, my, scroll, 40 * k);

  function handlePointerMove(e: React.PointerEvent<HTMLElement>) {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <section
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        rawX.set(0);
        rawY.set(0);
      }}
      className="relative isolate overflow-hidden bg-brand pb-16 sm:pb-24"
    >
      {/* Looping yellow ribbon that draws itself across the background */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 -z-10 size-full"
        aria-hidden="true"
      >
        <motion.path
          d="M-40 520 C120 520 180 380 140 300 C100 220 0 260 30 340 C60 420 220 400 300 260 C380 120 420 40 560 30 C680 22 760 22 880 30 C1040 40 1120 160 1160 300 C1200 440 1260 520 1480 560"
          fill="none"
          stroke="#F7E14B"
          strokeWidth="7"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.9 }}
          transition={{ pathLength: { duration: 2.4, ease: "easeInOut", delay: 0.3 }, opacity: { duration: 0.2, delay: 0.3 } }}
        />
      </svg>

      {/* Pinwheel (left) and flower (right), spinning gently */}
      <motion.div style={pinwheel} className="pointer-events-none absolute -left-16 top-[58%] w-40 sm:-left-10 sm:top-[26%] sm:w-56 lg:left-[2%] lg:w-64">
        <motion.svg
          viewBox="0 0 200 200"
          className="w-full text-[#A5DDCF]"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ scale: spring(0.6), rotate: { duration: 40, repeat: Infinity, ease: "linear" } }}
          aria-hidden="true"
        >
          {[0, 90, 180, 270].map((r) => (
            <path key={r} transform={`rotate(${r} 100 100)`} fill="currentColor" d="M100 100 C100 60 130 20 170 30 C200 40 190 90 150 100 Z" opacity="0.9" />
          ))}
          <circle cx="100" cy="100" r="14" fill="#086F54" />
        </motion.svg>
      </motion.div>

      <motion.div style={flower} className="pointer-events-none absolute -right-10 top-[44%] w-32 sm:right-[2%] sm:top-[40%] sm:w-40 lg:right-[5%] lg:w-48">
        <motion.svg
          viewBox="0 0 200 200"
          className="w-full text-[#9CC4F2]"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: -360 }}
          transition={{ scale: spring(0.8), rotate: { duration: 30, repeat: Infinity, ease: "linear" } }}
          aria-hidden="true"
        >
          <path fill="currentColor" d="M100 20 C130 20 140 60 120 80 C140 60 180 70 180 100 C180 130 140 140 120 120 C140 140 130 180 100 180 C70 180 60 140 80 120 C60 140 20 130 20 100 C20 70 60 60 80 80 C60 60 70 20 100 20 Z" />
        </motion.svg>
      </motion.div>

      {/* Pulsing "+" hotspots */}
      <motion.div style={dots} className="pointer-events-none absolute inset-0" aria-hidden="true">
        {[
          "left-[18%] top-[30%] hidden md:block",
          "right-[22%] top-[22%] hidden md:block",
          "left-[30%] top-[58%] hidden md:block",
          "right-[14%] top-[66%] hidden md:block",
        ].map((pos, i) => (
          <span key={pos} className={`absolute ${pos}`}>
            <motion.span
              className="absolute -inset-2 rounded-full bg-sunny/30"
              animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }}
            />
            <span className="relative grid size-6 place-items-center rounded-full bg-sunny text-sm font-black leading-none text-ink">+</span>
          </span>
        ))}
      </motion.div>

      {/* Headline */}
      <div className="relative mx-auto max-w-5xl px-4 pt-[132px] text-center sm:px-6 sm:pt-40 lg:pt-[176px]">
        <h1 className="font-display text-[2.7rem] font-semibold leading-[1.08] text-white sm:text-6xl lg:text-[4.6rem]">
          <span className="block">
            <Word delay={0.3}>Making</Word>{" "}
            {/* Round "photo bubble" with Blocky inside, wobbling */}
            <motion.span
              aria-hidden="true"
              className="relative mx-1 inline-grid size-[0.95em] translate-y-[0.12em] place-items-center overflow-hidden rounded-full border-[0.06em] border-ink bg-sunny align-baseline sm:mx-2"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: [0, -8, 8, 0] }}
              transition={{ scale: spring(0.5), rotate: { duration: 3, repeat: Infinity, delay: 1.5 } }}
            >
              <Mascot className="mt-[0.2em] w-[0.85em]" color="#EF6F6C" />
            </motion.span>{" "}
            <Word delay={0.4}>Childhood</Word>
          </span>
          <span className="block">
            <Word delay={0.5}>a</Word>{" "}
            <Word delay={0.56}>
              {/* Lilac highlight swipe behind "Little" */}
              <motion.span
                aria-hidden="true"
                className="absolute inset-x-[-0.12em] bottom-[0.08em] top-[0.22em] -z-10 origin-left -rotate-2 rounded-[0.3em] bg-[#B9A6F5]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.2, duration: 0.5, ease: "easeOut" }}
              />
              Little
            </Word>{" "}
            <Word delay={0.62}>More</Word>
          </span>
          <span className="block">
            <Word delay={0.72}>
              Wonderful.
              {/* Marker underline that draws in */}
              <svg viewBox="0 0 300 24" preserveAspectRatio="none" className="absolute -bottom-[0.12em] left-0 h-[0.28em] w-full text-sunny" aria-hidden="true">
                <motion.path
                  d="M4 16 C60 6 120 4 170 10 C210 14 250 16 296 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1.5, duration: 0.6, ease: "easeInOut" }}
                />
              </svg>
            </Word>
          </span>
        </h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mx-auto mt-7 max-w-[32rem] text-balance text-[15px] leading-relaxed text-white/90 sm:mt-9 sm:text-base"
        >
          Discover thoughtfully selected feeding essentials, adorable accessories and playful finds
          for your little stars.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring(1.25) }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <MotionLink
            href="/shop"
            className="inline-flex h-12 items-center rounded-full bg-coral px-9 text-[15px] font-bold text-white shadow-pop"
            whileHover={{ y: -3, boxShadow: "0 9px 0 0 #1b1b1b" }}
            whileTap={{ y: 6, boxShadow: "0 0px 0 0 #1b1b1b" }}
          >
            Shop Now
          </MotionLink>
          <MotionLink
            href="/categories"
            className="inline-flex h-12 items-center rounded-full border-2 border-white/80 px-6 text-[15px] font-bold text-white transition-colors hover:bg-white hover:text-brand"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore Categories
          </MotionLink>
        </motion.div>
      </div>

      {/* Spotlight with tilted photo cards peeking out behind it */}
      <div className="relative mx-auto mt-14 max-w-[880px] px-4 sm:mt-16 sm:px-6">
        <motion.div
          style={leftCard}
          className="pointer-events-none absolute -left-64 top-6 hidden w-80 xl:block"
        >
          <motion.div
            initial={{ x: 200, rotate: 0, opacity: 0 }}
            animate={{ x: 0, rotate: -6, opacity: 1 }}
            transition={spring(1.5)}
          >
            <Image src="/images/siblings.png" alt="" width={988} height={1083} sizes="320px" className="h-auto w-full drop-shadow-[0_20px_25px_rgba(0,0,0,0.25)]" />
          </motion.div>
        </motion.div>
        <motion.div
          style={rightCard}
          className="pointer-events-none absolute -right-60 top-0 hidden w-72 xl:block"
        >
          <motion.div
            initial={{ x: -200, rotate: 0, opacity: 0 }}
            animate={{ x: 0, rotate: 7, opacity: 1 }}
            transition={spring(1.6)}
          >
            <Image src="/images/kids-playing.png" alt="" width={1195} height={1433} sizes="300px" className="h-auto w-full drop-shadow-[0_20px_25px_rgba(0,0,0,0.25)]" />
          </motion.div>
        </motion.div>

        <motion.div initial={{ y: 80, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={spring(1.35)} className="relative">
          <HeroSpotlight products={products} categories={categories} />
        </motion.div>
      </div>

      {/* White arc into the next section */}
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-24 w-full text-white sm:h-40" aria-hidden="true">
        <path fill="currentColor" d="M0 120 V70 C360 0 1080 0 1440 70 V120 Z" />
      </svg>
    </section>
  );
}
