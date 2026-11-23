"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

type Props = {
  eyebrow: string;
  title: string;
  id?: string;
  action?: { href: string; label: string };
};

/** Coral eyebrow + Fredoka heading + optional "view all" link. */
export function SectionHeading({ eyebrow, title, id, action }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-[15px] font-semibold text-coral"
        >
          {eyebrow}
        </motion.p>
        <motion.h2
          id={id}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.08 }}
          className="mt-1 font-display text-3xl font-semibold text-ink sm:text-[2.5rem] sm:leading-tight"
        >
          {title}
        </motion.h2>
      </div>
      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href={action.href}
            className="group inline-flex items-center gap-1.5 pb-1 text-[15px] font-semibold text-ink transition-colors hover:text-brand"
          >
            {action.label}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
