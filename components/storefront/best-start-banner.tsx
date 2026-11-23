"use client";

import Link from "next/link";
import { motion, useAnimationControls } from "motion/react";
import { Mascot } from "./mascot";

const MotionLink = motion.create(Link);

/** Toy blocks that drop in one after another, from the bottom row up. */
const BLOCKS = [
  { letter: "A", color: "bg-sunny", y: "bottom-0", left: "left-[4%]", rotate: -6 },
  { letter: "B", color: "bg-white", y: "bottom-0", left: "left-[36%]", rotate: 4 },
  { letter: "C", color: "bg-[#7B6CF6] text-white", y: "bottom-0", left: "left-[68%]", rotate: -3 },
  { letter: "1", color: "bg-[#A5DDCF]", y: "bottom-[27%]", left: "left-[20%]", rotate: 8 },
  { letter: "2", color: "bg-[#F5B8D0]", y: "bottom-[27%]", left: "left-[52%]", rotate: -7 },
  { letter: "3", color: "bg-[#FFB347]", y: "bottom-[54%]", left: "left-[36%]", rotate: 5 },
];

export function BestStartBanner() {
  return (
    <section aria-labelledby="best-start-heading" className="relative bg-[#FDF8E9] px-4 pb-40 pt-24 sm:px-6 sm:pb-52 sm:pt-28">
      <div className="relative mx-auto max-w-6xl">
        {/* Mascot perched on the card's top edge */}
        <motion.div
          initial={{ y: -120, opacity: 0, rotate: -20 }}
          whileInView={{ y: 0, opacity: 1, rotate: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 160, damping: 9, delay: 0.2 }}
          className="absolute -top-[72px] left-6 z-20 w-[92px] sm:left-10 sm:w-[110px]"
        >
          <Mascot className="w-full" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 90, damping: 16 }}
          className="relative grid overflow-hidden rounded-[36px] bg-coral md:grid-cols-[1.1fr_1fr]"
        >
          {/* Copy */}
          <div className="relative z-10 px-7 pb-10 pt-16 sm:px-12 sm:pb-14 sm:pt-20">
            <h2 id="best-start-heading" className="font-display text-4xl font-semibold leading-[1.05] text-white sm:text-[3.4rem]">
              Give Them the
              <br />
              Best Start.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/90">
              From first spoonfuls to playtime favourites, find everything your little one needs in
              one happy place.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <MotionLink
                href="/shop"
                whileHover={{ y: -3, boxShadow: "0 8px 0 0 #1b1b1b" }}
                whileTap={{ y: 4, boxShadow: "0 0 0 0 #1b1b1b" }}
                className="inline-flex h-12 items-center rounded-full bg-sunny px-8 text-[15px] font-extrabold text-ink shadow-pop"
              >
                Shop Now
              </MotionLink>
              <MotionLink
                href="/categories"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex h-12 items-center rounded-full border-2 border-white/70 px-7 text-[15px] font-bold text-white transition-colors hover:bg-white hover:text-coral"
              >
                Explore Categories
              </MotionLink>
            </div>
          </div>

          {/* Mint blob + tumbling block tower */}
          <div className="relative min-h-[300px] md:min-h-0">
            <svg viewBox="0 0 500 420" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
              <motion.path
                fill="#A5DDCF"
                initial={{ d: "M120 0 H500 V420 H60 C110 360 20 300 70 230 C120 160 40 90 120 0 Z" }}
                animate={{
                  d: [
                    "M120 0 H500 V420 H60 C110 360 20 300 70 230 C120 160 40 90 120 0 Z",
                    "M140 0 H500 V420 H40 C100 350 50 290 90 220 C130 150 70 80 140 0 Z",
                    "M120 0 H500 V420 H60 C110 360 20 300 70 230 C120 160 40 90 120 0 Z",
                  ],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
            </svg>

            {/* The visible tower area triggers the drop; the blocks start far
                above it, so they can't detect being in view themselves. */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="absolute bottom-6 left-1/2 aspect-square h-[80%] max-h-[340px] -translate-x-1/2"
            >
              {BLOCKS.map((b, i) => (
                <ToyBlock key={b.letter} block={b} index={i} />
              ))}
            </motion.div>

            {/* Sparkles */}
            {[
              ["right-[8%] top-[12%]", 0],
              ["left-[14%] top-[20%]", 0.8],
              ["right-[20%] top-[40%]", 1.6],
            ].map(([pos, delay]) => (
              <motion.svg
                key={pos as string}
                viewBox="0 0 24 24"
                className={`absolute size-6 text-white ${pos}`}
                animate={{ scale: [0, 1, 0], rotate: [0, 90, 180] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: delay as number }}
                aria-hidden="true"
              >
                <path fill="currentColor" d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
              </motion.svg>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Sunny hill */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-24 w-full text-sunny sm:h-32"
        aria-hidden="true"
      >
        <path fill="currentColor" d="M0 120 C240 10 520 -10 720 4 C940 18 1200 40 1440 120 Z" />
      </svg>
    </section>
  );
}

function ToyBlock({ block, index }: { block: (typeof BLOCKS)[number]; index: number }) {
  const controls = useAnimationControls();

  // Tap a block and it hops.
  function hop() {
    controls.start({
      y: [0, -40, 0],
      rotate: [block.rotate, block.rotate + 25, block.rotate],
      transition: { duration: 0.55, ease: "easeOut" },
    });
  }

  return (
    <motion.div
      variants={{
        hidden: { y: -500, opacity: 0, rotate: block.rotate * 4 },
        show: {
          y: 0,
          opacity: 1,
          rotate: block.rotate,
          transition: { type: "spring", stiffness: 220, damping: 11, mass: 0.9, delay: 0.3 + index * 0.18 },
        },
      }}
      className={`absolute ${block.y} ${block.left} w-[28%]`}
    >
      <motion.button
        type="button"
        onClick={hop}
        animate={controls}
        whileHover={{ scale: 1.08, rotate: block.rotate + 6 }}
        aria-hidden="true"
        tabIndex={-1}
        className={`grid aspect-square w-full place-items-center rounded-2xl border-[3px] border-ink font-display text-3xl font-semibold text-ink shadow-pop sm:text-5xl ${block.color}`}
      >
        {block.letter}
      </motion.button>
    </motion.div>
  );
}
