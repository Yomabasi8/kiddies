"use client";

import { motion, type Transition } from "motion/react";

/**
 * Hand-drawn doodles for the hero. Each draws itself in (pathLength), then
 * keeps a small idle animation going. All strokes use currentColor.
 */

const draw = (delay: number, duration = 0.9): Transition => ({
  pathLength: { delay, duration, ease: "easeInOut" },
  opacity: { delay, duration: 0.01 },
});

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function LightbulbDoodle({ className }: { className?: string }) {
  const rays = ["M50 3 L50 12", "M27 9 L32 17", "M73 9 L68 17", "M10 25 L18 30", "M90 25 L82 30", "M5 46 L14 46", "M95 46 L86 46"];
  return (
    <svg viewBox="0 0 100 110" className={className} aria-hidden="true">
      <g {...stroke} strokeWidth={2.4}>
        <motion.path
          d="M39 71 C31 62 26 54 26 44 C26 30 37 21 50 21 C63 21 74 30 74 44 C74 54 69 62 61 71 Z"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={draw(0.9, 1.1)}
        />
        <motion.path
          d="M43 68 C41 57 45 49 49 53 C53 57 44 61 49 51 C52 45 58 50 57 68"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={draw(1.6, 0.8)}
        />
        {["M39 76 L61 74", "M39 82 L61 80", "M41 88 L59 86", "M45 94 L55 93"].map((d, i) => (
          <motion.path key={d} d={d} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={draw(1.8 + i * 0.1, 0.3)} />
        ))}
        {rays.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 0.35, 1] }}
            transition={{
              pathLength: { delay: 2.2 + i * 0.06, duration: 0.25 },
              opacity: { delay: 2.2 + i * 0.06, duration: 1.6, repeat: Infinity, repeatType: "reverse", repeatDelay: 1.2 },
            }}
          />
        ))}
      </g>
    </svg>
  );
}

export function PaperPlaneDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 90" className={className} aria-hidden="true">
      <g {...stroke} strokeWidth={2}>
        {/* Dashed flight trail: the dashes march toward the plane */}
        <motion.path
          d="M4 70 C28 76 58 74 78 62 C94 52 88 34 76 40 C65 46 72 63 90 61 C101 59 108 52 114 46"
          strokeDasharray="5 6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, strokeDashoffset: [0, -22] }}
          transition={{ opacity: { delay: 1.4, duration: 0.6 }, strokeDashoffset: { duration: 1.2, repeat: Infinity, ease: "linear" } }}
        />
        <motion.g
          initial={{ x: -40, y: 30, opacity: 0, rotate: -15 }}
          animate={{ x: 0, y: [0, -5, 0], opacity: 1, rotate: [0, -3, 0] }}
          transition={{
            x: { delay: 1.2, type: "spring", stiffness: 60, damping: 12 },
            opacity: { delay: 1.2, duration: 0.3 },
            y: { delay: 2, duration: 3, repeat: Infinity, ease: "easeInOut" },
            rotate: { delay: 2, duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{ originX: "75%", originY: "45%" }}
        >
          <path d="M112 44 L196 6 L150 74 Z" />
          <path d="M196 6 L132 54 L150 74" />
          <path d="M132 54 L130 72 L142 62" />
        </motion.g>
      </g>
    </svg>
  );
}

export function SwirlArrowDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 70" className={className} aria-hidden="true">
      <g {...stroke} strokeWidth={3}>
        <motion.path
          d="M4 64 C24 52 44 38 58 32 C78 24 82 8 70 6 C57 4 54 26 67 31 C82 36 99 25 112 18"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={draw(1.5, 1.1)}
        />
        <motion.path d="M99 12 L113 17 L105 29" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={draw(2.5, 0.3)} />
      </g>
    </svg>
  );
}

export function SparksDoodle({ className }: { className?: string }) {
  const sparks = ["M20 4 L12 46", "M50 34 L32 62", "M76 66 L46 82"];
  return (
    <svg viewBox="0 0 80 90" className={className} aria-hidden="true">
      <g {...stroke} strokeWidth={6}>
        {sparks.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1, 0.55, 1], opacity: 1 }}
            transition={{
              pathLength: { delay: 2 + i * 0.15, duration: 2.4, times: [0, 0.2, 0.6, 0.8, 1], repeat: Infinity, repeatDelay: 0.8 },
              opacity: { delay: 2 + i * 0.15, duration: 0.01 },
            }}
          />
        ))}
      </g>
    </svg>
  );
}

/** Bumpy cloud edge that the hero sits on. */
export function CloudEdge({ className, variant = "front" }: { className?: string; variant?: "front" | "back" }) {
  const d =
    variant === "front"
      ? "M0 220 V112 C26 62 108 52 142 96 C170 30 292 24 330 96 C362 66 414 72 432 108 C468 58 548 66 566 122 C640 116 800 116 874 122 C896 60 978 40 1018 92 C1050 38 1152 30 1182 88 C1222 54 1290 60 1310 102 C1340 40 1420 38 1440 66 V220 Z"
      : "M0 220 V80 C60 30 150 40 190 76 C230 20 340 10 380 70 C430 30 510 40 540 90 C600 40 700 50 720 96 C760 44 860 40 890 84 C940 26 1060 24 1090 80 C1130 40 1230 44 1260 86 C1300 30 1400 30 1440 60 V220 Z";
  return (
    <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path fill="currentColor" d={d} />
    </svg>
  );
}
