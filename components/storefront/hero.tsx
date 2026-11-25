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
import { ArrowRight, Sparkles, Truck } from "lucide-react";
import { CloudEdge, LightbulbDoodle, PaperPlaneDoodle, SparksDoodle, SwirlArrowDoodle } from "./hero-doodles";
import { HeroBubbles } from "./hero-bubbles";
import { Mascot } from "./mascot";
import { useFreeDeliveryOffer } from "./offer-context";

const HEADLINE = [["Making", "Childhood"], ["a", "Little", "More", "Wonderful."]];
const MotionLink = motion.create(Link);

/** Moves a layer with the pointer (depth in px) plus scroll parallax. */
function useParallax(mx: MotionValue<number>, my: MotionValue<number>, scroll: MotionValue<number>, depth: number, scrollDepth = 0) {
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform([my, scroll], ([py, s]: number[]) => py * depth + s * scrollDepth);
  return { x, y };
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const offer = useFreeDeliveryOffer();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18 });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const scroll = useTransform(scrollYProgress, (v) => (reduceMotion ? 0 : v));

  const k = reduceMotion ? 0 : 1;
  const bulb = useParallax(mx, my, scroll, 26 * k);
  const plane = useParallax(mx, my, scroll, -30 * k);
  const leftCard = useParallax(mx, my, scroll, 14 * k, 70);
  const rightCard = useParallax(mx, my, scroll, 18 * k, 90);
  const centerCard = useParallax(mx, my, scroll, -10 * k, 30);
  const swirl = useParallax(mx, my, scroll, 34 * k);
  const sparks = useParallax(mx, my, scroll, -34 * k);

  function handlePointerMove(e: React.PointerEvent<HTMLElement>) {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  let wordIndex = 0;

  return (
    <section
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        rawX.set(0);
        rawY.set(0);
      }}
      className="relative isolate overflow-hidden bg-brand"
    >
      <HeroBubbles />

      {/* Copy */}
      <div className="relative mx-auto max-w-6xl px-4 pt-[118px] text-center sm:px-6 sm:pt-[140px] lg:pt-[160px]">
        <motion.div style={bulb} className="pointer-events-none absolute left-[6%] top-36 hidden w-20 text-white md:block lg:left-[9%] lg:top-[150px] lg:w-[92px]">
          <LightbulbDoodle className="w-full -rotate-12" />
        </motion.div>
        <motion.div style={plane} className="pointer-events-none absolute right-[4%] top-[64%] hidden w-36 text-white md:block lg:right-[9%] lg:w-44">
          <PaperPlaneDoodle className="w-full" />
        </motion.div>

        {/* Honest "what's new" pill (no ratings until there are real reviews) */}
        <motion.div initial={{ y: -16, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.2 }}>
          <Link
            href={offer.active ? "/shop" : "/shop?sort=newest"}
            className="group inline-flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/20"
          >
            <span className="grid size-7 place-items-center rounded-full bg-sunny text-ink">
              <motion.span animate={{ rotate: [0, 20, -10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4 }}>
                {offer.active ? <Truck className="size-4" /> : <Sparkles className="size-4" />}
              </motion.span>
            </span>
            {offer.active ? `Free delivery on every order until ${offer.ends}` : "New arrivals are in"}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.1] text-white sm:mt-7 sm:text-5xl sm:leading-[1.08] lg:text-[3.5rem]">
          {HEADLINE.map((line, li) => (
            <span key={li} className="block text-balance sm:whitespace-nowrap">
              {line.map((word, wi) => {
                const i = wordIndex++;
                const isWonderful = word === "Wonderful.";
                return (
                  <span key={word} className="inline-block">
                    <motion.span
                      className="relative inline-block cursor-default"
                      initial={{ y: 70, rotate: 10, opacity: 0 }}
                      animate={{ y: 0, rotate: 0, opacity: 1 }}
                      whileHover={{ y: -6, rotate: wi % 2 ? 4 : -4, scale: 1.06 }}
                      transition={{ type: "spring", stiffness: 180, damping: 13, delay: 0.35 + i * 0.07 }}
                    >
                      {word}
                      {isWonderful && (
                        <svg viewBox="0 0 300 30" preserveAspectRatio="none" className="absolute -bottom-[0.2em] left-0 h-[0.3em] w-full text-sunny" aria-hidden="true">
                          <motion.path
                            d="M4 15 Q 22 4 40 15 T 76 15 T 112 15 T 148 15 T 184 15 T 220 15 T 256 15 T 294 15"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 1.3, duration: 0.8, ease: "easeInOut" }}
                          />
                        </svg>
                      )}
                    </motion.span>
                    {wi < line.length - 1 && " "}
                  </span>
                );
              })}
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.6, ease: "easeOut" }}
          className="mx-auto mt-7 max-w-[31rem] text-balance text-[15px] leading-[1.4] text-white/90 sm:mt-8"
        >
          Discover thoughtfully selected feeding essentials, adorable accessories and playful finds for your little stars.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.15, type: "spring", stiffness: 140, damping: 14 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:mt-9 sm:gap-6"
        >
          <MotionLink
            href="/shop"
            className="inline-flex h-12 items-center rounded-full bg-coral px-9 text-[15px] font-bold text-white shadow-pop"
            whileHover={{ y: -3, boxShadow: "0 9px 0 0 #1b1b1b" }}
            whileTap={{ y: 6, boxShadow: "0 0px 0 0 #1b1b1b" }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            Shop Now
          </MotionLink>
          <MotionLink
            href="/categories"
            className="inline-flex h-12 items-center rounded-full border-[1.5px] border-white/80 px-6 text-[15px] font-bold text-white transition-colors hover:bg-white hover:text-brand"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            Explore Categories
          </MotionLink>
        </motion.div>
      </div>

      {/* Fanned photo cards */}
      <div className="relative mx-auto mt-12 aspect-[640/440] w-[min(88vw,640px)]">
        <motion.div style={swirl} className="pointer-events-none absolute -left-[14%] -top-[6%] z-40 hidden w-[17%] text-sunny sm:block">
          <SwirlArrowDoodle className="w-full" />
        </motion.div>
        <motion.div style={sparks} className="pointer-events-none absolute -right-[11%] top-[4%] z-40 hidden w-[11%] text-sunny sm:block">
          <SparksDoodle className="w-full" />
        </motion.div>

        <PhotoCard parallax={leftCard} className="left-0 top-0 z-10 w-[50%]" fromX="50%" rotate={0} floatDelay={0} delay={1.4} src="/images/siblings.png" width={988} height={1083} alt="Two young children stacking colourful wooden blocks" />
        <PhotoCard parallax={rightCard} className="right-0 top-[2%] z-10 w-[50%]" fromX="-50%" rotate={0} floatDelay={1.2} delay={1.5} src="/images/reading.png" width={1677} height={1764} alt="Two girls reading a picture book together" />
        <PhotoCard
          parallax={centerCard}
          className="left-[27.5%] top-[11%] z-30 w-[45%]"
          fromX={0}
          rotate={0}
          floatDelay={0.6}
          delay={1.25}
          preload
          src="/images/boy-playing.png"
          width={1195}
          height={1433}
          alt="A young boy playing with a toy train set"
          peek
        />
      </div>

      {/* Two cloud layers: the back one drifts, the front one holds the cards */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 70, damping: 16 }}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
      >
        <motion.div
          animate={reduceMotion ? undefined : { x: ["-2%", "2%", "-2%"] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-x-[-4%] bottom-6 sm:bottom-10"
        >
          <CloudEdge variant="back" className="block h-[110px] w-full text-white/40 sm:h-[160px] lg:h-[200px]" />
        </motion.div>
        <CloudEdge className="relative block h-[110px] w-[calc(100%+2px)] text-white sm:h-[160px] lg:h-[200px]" />
      </motion.div>
    </section>
  );
}

type PhotoCardProps = {
  parallax: { x: MotionValue<number>; y: MotionValue<number> };
  className: string;
  fromX: number | string;
  rotate: number;
  delay: number;
  floatDelay: number;
  src: string;
  width: number;
  height: number;
  alt: string;
  preload?: boolean;
  /** Blocky peeks over the top edge and waves. */
  peek?: boolean;
};

function PhotoCard({ parallax, className, fromX, rotate, delay, floatDelay, src, width, height, alt, preload, peek }: PhotoCardProps) {
  return (
    <motion.div style={parallax} className={`absolute ${className}`}>
      {/* Deal-out entrance: cards start stacked in the middle, then fan out */}
      <motion.div
        initial={{ x: fromX, y: 120, rotate: 0, scale: 0.7, opacity: 0 }}
        animate={{ x: 0, y: 0, rotate, scale: 1, opacity: 1 }}
        transition={{ delay, type: "spring", stiffness: 90, damping: 14 }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ delay: delay + 1, duration: 4.5 + floatDelay, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.04, rotate: [0, -3, 3, -2, 0], transition: { duration: 0.5 } }}
          className="relative isolate"
        >
          {peek && (
            <motion.div
              initial={{ y: "70%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: delay + 0.9, type: "spring", stiffness: 160, damping: 10 }}
              className="absolute -top-[19%] right-[8%] -z-10 w-[30%]"
            >
              <Mascot className="w-full" color="#EF6F6C" />
            </motion.div>
          )}
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            preload={preload}
            sizes="(min-width: 640px) 320px, 46vw"
            className="relative h-auto w-full select-none drop-shadow-[0_20px_25px_rgba(0,0,0,0.18)]"
            draggable={false}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
