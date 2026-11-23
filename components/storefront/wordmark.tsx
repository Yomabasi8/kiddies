"use client";

import { motion } from "motion/react";

/**
 * Giant "kiddies accessories" wordmark. Letters drop in one after another,
 * then each i-dot lands as a glossy ball and bounces. Uses the dotless "ı"
 * so the balls can stand in for the dots.
 */
const LINES = [
  ["k", "ı", "d", "d", "ı", "e", "s"],
  ["A", "c", "c", "e", "s", "s", "o", "r", "ı", "e", "s"],
];
const DOT_COLORS = ["#EF6F6C", "#4FB3A5", "#7B6CF6"];

export function Wordmark() {
  let letterIndex = 0;
  let dotIndex = 0;

  return (
    <motion.p
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      aria-label="Kiddies Accessories"
      className="select-none font-display text-[clamp(3.4rem,15.5vw,11.5rem)] font-semibold leading-[0.92] tracking-[-0.02em] text-ink"
    >
      {LINES.map((line, li) => (
        <span key={li} className="block whitespace-nowrap">
          {line.map((ch, ci) => {
            const i = letterIndex++;
            const dot = ch === "ı" ? dotIndex++ : -1;
            return (
              <motion.span
                key={ci}
                aria-hidden="true"
                className="relative inline-block cursor-default"
                variants={{
                  hidden: { y: "-120%", opacity: 0, rotate: i % 2 ? 12 : -12 },
                  show: {
                    y: 0,
                    opacity: 1,
                    rotate: 0,
                    transition: { type: "spring", stiffness: 260, damping: 12, delay: i * 0.06 },
                  },
                }}
                whileHover={{ y: "-8%", rotate: i % 2 ? 6 : -6 }}
              >
                {ch}
                {dot >= 0 && (
                  <motion.span
                    className="absolute left-1/2 top-[0.02em] block size-[0.27em] -translate-x-1/2 rounded-full border-[0.025em] border-ink"
                    style={{ background: DOT_COLORS[dot % DOT_COLORS.length] }}
                    variants={{
                      hidden: { y: "-400%", opacity: 0 },
                      show: {
                        y: ["-400%", "0%", "-60%", "0%", "-15%", "0%"],
                        scaleY: [1, 0.75, 1.05, 0.9, 1, 1],
                        opacity: 1,
                        transition: { delay: 1.3 + dot * 0.3, duration: 1.1, ease: "easeOut" },
                      },
                    }}
                  >
                    <span className="absolute left-[18%] top-[16%] size-[28%] rounded-full bg-white/70" />
                  </motion.span>
                )}
              </motion.span>
            );
          })}
        </span>
      ))}
    </motion.p>
  );
}
