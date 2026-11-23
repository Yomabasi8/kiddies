"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Soap bubbles drifting up the hero. Tap one and it pops (and comes back
 * later). Positions are fixed so server and client render the same markup.
 */
const BUBBLES = [
  { left: "6%", size: 46, delay: 0, duration: 14 },
  { left: "17%", size: 26, delay: 4, duration: 11 },
  { left: "29%", size: 34, delay: 8, duration: 16 },
  { left: "71%", size: 30, delay: 2, duration: 13 },
  { left: "82%", size: 52, delay: 6, duration: 17 },
  { left: "93%", size: 24, delay: 10, duration: 12 },
  { left: "48%", size: 20, delay: 12, duration: 15 },
];

export function HeroBubbles() {
  const reduce = useReducedMotion();
  const [popped, setPopped] = useState<Record<number, number>>({});
  if (reduce) return null;

  function pop(i: number) {
    setPopped((p) => ({ ...p, [i]: (p[i] ?? 0) + 1 }));
  }

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <AnimatePresence key={i}>
          <motion.button
            key={popped[i] ?? 0}
            type="button"
            tabIndex={-1}
            onClick={() => pop(i)}
            className="pointer-events-auto absolute bottom-0 cursor-pointer rounded-full border-2 border-white/50 bg-white/[0.08] shadow-[inset_-4px_-6px_12px_rgba(255,255,255,0.25)]"
            style={{ left: b.left, width: b.size, height: b.size }}
            initial={{ y: 80, opacity: 0, scale: 0.6 }}
            animate={{ y: [80, -900], x: [0, 18, -14, 10, 0], opacity: [0, 1, 1, 0.9, 0], scale: 1 }}
            exit={{ scale: 1.8, opacity: 0, transition: { duration: 0.18 } }}
            transition={{
              y: { duration: b.duration, repeat: Infinity, delay: (popped[i] ? 1.5 : b.delay), ease: "linear" },
              x: { duration: b.duration / 2, repeat: Infinity, ease: "easeInOut", delay: popped[i] ? 1.5 : b.delay },
              opacity: { duration: b.duration, repeat: Infinity, times: [0, 0.08, 0.6, 0.9, 1], delay: popped[i] ? 1.5 : b.delay },
              scale: { duration: 0.6, delay: popped[i] ? 1.5 : b.delay },
            }}
          >
            <span className="absolute left-[22%] top-[18%] size-[26%] rounded-full bg-white/70" />
          </motion.button>
        </AnimatePresence>
      ))}
    </div>
  );
}
