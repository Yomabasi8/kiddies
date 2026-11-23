"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Mascot } from "./mascot";

/**
 * Wavy 3×3 mosaic for the About page: photos on the edges, bright letter
 * tiles in the corners, Blocky in the centre. Each tile is clipped to a
 * pinched "pillow" shape so the grid looks gently warped.
 */

type Tile =
  | { kind: "photo"; src: string; alt: string; position?: string }
  | { kind: "letter"; char: string; bg: string; ink: string; shadow: string }
  | { kind: "mascot"; bg: string };

const TILES: Tile[] = [
  { kind: "letter", char: "K", bg: "#B98BE0", ink: "#3D7CC9", shadow: "#F7E14B" },
  { kind: "photo", src: "/images/collections/girl-ball-pit.jpg", alt: "A laughing girl in a ball pit", position: "50% 30%" },
  { kind: "letter", char: "A", bg: "#F7D864", ink: "#1B1B1B", shadow: "#EF6F6C" },
  { kind: "photo", src: "/images/collections/boy-blowing-bubbles.jpg", alt: "A boy blowing bubbles", position: "50% 22%" },
  { kind: "mascot", bg: "#5DB57E" },
  { kind: "photo", src: "/images/collections/girl-shape-sorter-house.jpg", alt: "A girl playing with a shape-sorting house", position: "50% 60%" },
  { kind: "letter", char: "1", bg: "#F28B3C", ink: "#FFFFFF", shadow: "#7B6CF6" },
  { kind: "photo", src: "/images/collections/baby-bath-time.jpg", alt: "A baby in an inflatable bath full of balls", position: "50% 50%" },
  { kind: "letter", char: "a", bg: "#E66BB8", ink: "#1B1B1B", shadow: "#A5DDCF" },
];

/** Corners bulge out, edge tiles pinch in, so neighbours look interlocked. */
const CLIP = {
  pinch: "M0,0 Q0.5,0.12 1,0 Q0.88,0.5 1,1 Q0.5,0.88 0,1 Q0.12,0.5 0,0 Z",
  bulge: "M0.04,0.04 Q0.5,-0.06 0.96,0.04 Q1.06,0.5 0.96,0.96 Q0.5,1.06 0.04,0.96 Q-0.06,0.5 0.04,0.04 Z",
};

/*
 * Geometry, in "units": each tile is 100 wide with a 6.5 gap, so the whole
 * mosaic is 313 units square. Tiles are positioned in % of that, which lets
 * the dashed outline below use the same units and fit at every screen size.
 */
const T = 100;
const G = 6.5;
const S = 3 * T + 2 * G; // 313
const pct = (u: number) => `${(u / S) * 100}%`;

/**
 * The mosaic's outer silhouette, pushed 7 units outward: follows each outer
 * tile edge (bulging corners, pinched middles) and bridges the gaps.
 */
const OUTLINE = [
  "M 4,-3 Q 50,-13 96,-3 L 106.5,-7 Q 156.5,5 206.5,-7 L 217,-3 Q 263,-13 309,-3",
  "L 316,4 Q 326,50 316,96 L 320,106.5 Q 308,156.5 320,206.5 L 316,217 Q 326,263 316,309",
  "L 309,316 Q 263,326 217,316 L 206.5,320 Q 156.5,308 106.5,320 L 96,316 Q 50,326 4,316",
  "L -3,309 Q -13,263 -3,217 L -7,206.5 Q 5,156.5 -7,106.5 L -3,96 Q -13,50 -3,4 Z",
].join(" ");
const PAD = 16; // room around the outline inside its SVG

export function AboutMosaic() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="relative mx-auto w-full max-w-[480px]">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <clipPath id="tile-pinch" clipPathUnits="objectBoundingBox"><path d={CLIP.pinch} /></clipPath>
          <clipPath id="tile-bulge" clipPathUnits="objectBoundingBox"><path d={CLIP.bulge} /></clipPath>
        </defs>
      </svg>

      {/* Dashed outline tracing the packed tiles */}
      <svg
        viewBox={`${-PAD} ${-PAD} ${S + 2 * PAD} ${S + 2 * PAD}`}
        className="pointer-events-none absolute overflow-visible text-ink/25"
        style={{ left: pct(-PAD), top: pct(-PAD), width: pct(S + 2 * PAD), height: pct(S + 2 * PAD) }}
        aria-hidden="true"
      >
        <motion.path
          d={OUTLINE}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="7 9"
          vectorEffect="non-scaling-stroke"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          animate={reduceMotion ? undefined : { strokeDashoffset: [0, -32] }}
          transition={{ opacity: { duration: 0.6, delay: 0.8 }, strokeDashoffset: { duration: 2.5, repeat: Infinity, ease: "linear" } }}
        />
      </svg>

      <ul className="relative aspect-square">
        {TILES.map((t, i) => {
          const pinched = t.kind === "photo";
          const col = i % 3;
          const row = Math.floor(i / 3);
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, scale: 0.4, rotate: i % 2 ? 12 : -12 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              whileHover={{ scale: 1.06, rotate: i % 2 ? 3 : -3, zIndex: 10 }}
              transition={{ type: "spring", stiffness: 200, damping: 14, delay: [4, 1, 3, 5, 7, 0, 2, 6, 8][i] * 0.08 }}
              className="absolute"
              style={{
                left: pct(col * (T + G)),
                top: pct(row * (T + G)),
                width: pct(T),
                height: pct(T),
                clipPath: `url(#${pinched ? "tile-pinch" : "tile-bulge"})`,
              }}
            >
              {t.kind === "photo" && (
                <Image src={t.src} alt={t.alt} fill sizes="(min-width: 1024px) 160px, 30vw" className="object-cover" style={{ objectPosition: t.position }} />
              )}
              {t.kind === "letter" && (
                <div className="grid size-full place-items-center" style={{ background: t.bg }} aria-hidden="true">
                  <motion.span
                    className="font-display text-[clamp(2.6rem,9vw,4.6rem)] font-semibold leading-none"
                    style={{ color: t.ink, textShadow: `4px 4px 0 ${t.shadow}` }}
                    animate={{ y: [0, -6, 0], rotate: [0, i % 2 ? 6 : -6, 0] }}
                    transition={{ duration: 3 + (i % 3) * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                  >
                    {t.char}
                  </motion.span>
                </div>
              )}
              {t.kind === "mascot" && (
                <div className="grid size-full place-items-center" style={{ background: t.bg }} aria-hidden="true">
                  <Mascot className="w-[58%]" color="#F7E14B" />
                </div>
              )}
            </motion.li>
          );
        })}
      </ul>

    </div>
  );
}
