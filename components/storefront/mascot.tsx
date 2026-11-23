"use client";

import { motion } from "motion/react";

/**
 * "Blocky": a friendly toy-block mascot that waves, blinks and bobs.
 * Decorative only.
 */
export function Mascot({ className, color = "#3D8BE0" }: { className?: string; color?: string }) {
  return (
    <motion.svg
      viewBox="0 0 120 150"
      className={className}
      aria-hidden="true"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <g stroke="#1b1b1b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Antennae */}
        <path d="M38 22 C34 12 24 12 22 4" fill="none" stroke="#F28B3C" strokeWidth="5" />
        <path d="M82 22 C86 12 96 12 98 4" fill="none" stroke="#F28B3C" strokeWidth="5" />
        <circle cx="21" cy="4" r="5" fill="#F28B3C" stroke="none" />
        <circle cx="99" cy="4" r="5" fill="#F28B3C" stroke="none" />

        {/* Legs */}
        <path d="M46 112 L44 138 L34 140" fill="none" />
        <path d="M74 112 L76 138 L86 140" fill="none" />

        {/* Left arm: resting */}
        <path d="M18 70 C8 74 6 84 10 92" fill="none" />

        {/* Right arm: waving */}
        <motion.path
          d="M102 64 C114 58 116 46 112 36"
          fill="none"
          style={{ originX: "102px", originY: "64px" }}
          animate={{ rotate: [0, -25, 10, -25, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
        />

        {/* Body */}
        <rect x="16" y="20" width="88" height="94" rx="18" fill={color} />
      </g>

      {/* Star freckles */}
      {[
        [34, 92],
        [58, 100],
        [84, 90],
        [30, 34],
      ].map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x} ${y - 5} L${x + 1.6} ${y - 1.6} L${x + 5} ${y - 1.2} L${x + 2.4} ${y + 1.2} L${x + 3.2} ${y + 5} L${x} ${y + 3} L${x - 3.2} ${y + 5} L${x - 2.4} ${y + 1.2} L${x - 5} ${y - 1.2} L${x - 1.6} ${y - 1.6} Z`}
          fill="#F7E14B"
        />
      ))}

      {/* Face */}
      <motion.g
        style={{ originY: "56px" }}
        animate={{ scaleY: [1, 1, 0.1, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
      >
        <ellipse cx="46" cy="56" rx="9" ry="10" fill="white" stroke="#1b1b1b" strokeWidth="3" />
        <ellipse cx="74" cy="56" rx="9" ry="10" fill="white" stroke="#1b1b1b" strokeWidth="3" />
        <circle cx="48" cy="58" r="4" fill="#1b1b1b" />
        <circle cx="72" cy="58" r="4" fill="#1b1b1b" />
      </motion.g>
      <circle cx="34" cy="70" r="5" fill="#F5A3B5" opacity="0.8" />
      <circle cx="86" cy="70" r="5" fill="#F5A3B5" opacity="0.8" />
      <path d="M52 72 Q60 80 68 72" fill="none" stroke="#1b1b1b" strokeWidth="3.5" strokeLinecap="round" />
    </motion.svg>
  );
}
