"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";

type Crumb = { href?: string; label: string };

/**
 * Green page banner used by inner storefront pages: breadcrumb, title,
 * optional intro, and the same playful shapes as the homepage hero.
 */
export function PageHeader({
  title,
  intro,
  crumbs,
  children,
}: {
  title: string;
  intro?: string;
  crumbs: Crumb[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-brand pb-20 pt-[120px] text-white sm:pb-24 sm:pt-[150px]">
      {/* Spinning pinwheel + flower, as on the homepage */}
      <motion.svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -left-12 top-16 -z-10 w-40 text-[#A5DDCF] opacity-80 sm:w-52"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      >
        {[0, 90, 180, 270].map((r) => (
          <path key={r} transform={`rotate(${r} 100 100)`} fill="currentColor" d="M100 100 C100 60 130 20 170 30 C200 40 190 90 150 100 Z" />
        ))}
      </motion.svg>
      <motion.svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-8 bottom-6 -z-10 w-28 text-[#9CC4F2] sm:w-36"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      >
        <path fill="currentColor" d="M100 20 C130 20 140 60 120 80 C140 60 180 70 180 100 C180 130 140 140 120 120 C140 140 130 180 100 180 C70 180 60 140 80 120 C60 140 20 130 20 100 C20 70 60 60 80 80 C60 60 70 20 100 20 Z" />
      </motion.svg>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-sm font-semibold text-white/70">
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
                {c.href ? (
                  <Link href={c.href} className="hover:text-white">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-white">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 16 }}
          className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-[3.25rem]"
        >
          {title}
        </motion.h1>
        {intro && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/85 sm:text-base"
          >
            {intro}
          </motion.p>
        )}
        {children}
      </div>

      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-12 w-full text-white sm:h-16" aria-hidden="true">
        <path fill="currentColor" d="M0 80 V40 C360 0 1080 0 1440 40 V80 Z" />
      </svg>
    </section>
  );
}
