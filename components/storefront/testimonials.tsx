"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Quote, Star } from "lucide-react";
import type { Testimonial } from "@/lib/testimonials";
import { cn } from "@/lib/utils";

const FRAME_COLORS = ["#C9B8F0", "#A5DDCF", "#F5B8D0", "#FFD9A8"];

/** Scalloped "flower" outline used to frame avatars. */
const SCALLOP =
  "M50 2 C58 2 62 9 69 10 C76 11 82 6 88 11 C94 16 91 24 94 30 C97 37 104 40 104 48 C104 56 97 59 95 66 C93 73 97 80 92 86 C87 92 79 89 73 92 C66 96 63 104 55 104 C47 104 43 97 36 95 C29 93 22 97 16 92 C10 87 13 79 10 73 C6 66 -1 63 -1 55 C-1 47 6 43 8 36 C10 29 6 22 11 16 C16 10 24 13 30 10 C37 7 42 2 50 2 Z";

/**
 * "Loved by Kids. Trusted by Parents." A drifting marquee of review cards.
 * Renders nothing until genuine testimonials exist.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;

  // Repeat the list so the marquee loops seamlessly.
  const loop = items.length < 4 ? [...items, ...items, ...items, ...items] : [...items, ...items];

  return (
    <section aria-labelledby="testimonials-heading" className="relative overflow-hidden bg-[#FDF8E9] pb-8 pt-20 sm:pt-28">
      <motion.h2
        id="testimonials-heading"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ type: "spring", stiffness: 110, damping: 16 }}
        className="px-4 text-center font-display text-3xl font-semibold leading-tight text-[#1F2A5C] sm:text-5xl"
      >
        Loved by Kids.
        <br />
        Trusted by{" "}
        <span className="relative inline-block">
          Parents.
          <svg viewBox="0 0 200 20" className="absolute -bottom-2 left-0 w-full text-[#7B6CF6]" aria-hidden="true">
            <motion.path
              d="M4 12 Q 20 2 36 12 T 68 12 T 100 12 T 132 12 T 164 12 T 196 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.9, ease: "easeInOut" }}
            />
          </svg>
        </span>
      </motion.h2>

      <div className="group relative mt-16 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <ul className="flex w-max animate-[marquee_45s_linear_infinite] gap-6 py-10 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {loop.map((t, i) => (
            <li key={`${t.id}-${i}`} aria-hidden={i >= items.length ? true : undefined}>
              <ReviewCard t={t} color={FRAME_COLORS[i % FRAME_COLORS.length]} tilt={i % 2 ? 1.5 : -1.5} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ReviewCard({ t, color, tilt }: { t: Testimonial; color: string; tilt: number }) {
  const initials = t.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <motion.figure
      whileHover={{ rotate: tilt, y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 16 }}
      className="relative w-[300px] rounded-[28px] bg-brand px-7 pb-7 pt-14 text-center text-white sm:w-[340px]"
    >
      {/* Scalloped avatar breaking out of the top edge */}
      <div className="absolute -top-11 left-1/2 size-[88px] -translate-x-1/2">
        <motion.svg
          viewBox="-2 0 108 106"
          className="absolute inset-0 size-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          aria-hidden="true"
        >
          <path d={SCALLOP} fill={color} />
        </motion.svg>
        <div className="absolute inset-[12%] overflow-hidden rounded-full bg-white">
          {t.avatar ? (
            <Image src={t.avatar} alt="" fill sizes="70px" className="object-cover" />
          ) : (
            <span className="grid size-full place-items-center font-display text-xl text-brand">{initials}</span>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-1" aria-label={`${t.rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn("size-4", i < t.rating ? "fill-sunny text-sunny" : "text-white/30")}
            aria-hidden="true"
          />
        ))}
      </div>
      <Quote className="mx-auto mt-4 size-6 fill-white text-white" aria-hidden="true" />
      <blockquote className="mt-3 text-sm leading-relaxed text-white/90">{t.quote}</blockquote>
      <figcaption className="mt-5">
        <span className="block text-sm font-extrabold">{t.name}</span>
        {t.context && <span className="mt-0.5 block text-xs text-white/60">{t.context}</span>}
      </figcaption>
    </motion.figure>
  );
}
