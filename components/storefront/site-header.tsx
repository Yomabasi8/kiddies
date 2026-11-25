"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { ANNOUNCEMENT_HEIGHT } from "./announcement-bar";
import { Menu, Search, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartButton } from "@/components/cart/cart-button";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const;

const ICON_LINKS = [
  { href: "/shop?focus=search", label: "Search products", Icon: Search },
  { href: "/account", label: "Your account", Icon: User },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));
  // Sit just below the announcement bar, sliding up as it scrolls away.
  const top = useTransform(scrollY, (y) => Math.max(0, ANNOUNCEMENT_HEIGHT - y));

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.1 }}
      style={{ top }}
      className="fixed inset-x-0 z-40"
    >
      <div
        className={cn(
          "relative mx-auto w-full max-w-[1000px] px-4 transition-[padding] duration-300 sm:px-6",
          scrolled ? "pt-3" : "pt-6 lg:pt-9",
        )}
      >
      <nav
        aria-label="Main"
        className={cn(
          "flex h-[64px] items-center justify-between rounded-[32px] bg-white pl-4 pr-5 transition-shadow duration-300 sm:h-[72px] sm:pl-5 sm:pr-7",
          scrolled
            ? "shadow-[0_12px_40px_-12px_rgba(0,0,0,0.3)] ring-1 ring-black/5"
            : "shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)]",
        )}
      >
        <Link href="/" aria-label="Kiddies Accessories home" className="shrink-0">
          <motion.span
            className="block"
            whileHover={{ rotate: -3, scale: 1.04 }}
            transition={{ type: "spring", stiffness: 300, damping: 12 }}
          >
            <Image
              src="/images/logo.png"
              alt="Kiddies Accessories"
              width={900}
              height={550}
              preload
              className="h-[54px] w-auto sm:h-[64px]"
            />
          </motion.span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex lg:gap-3">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="group relative block px-3 py-2 text-[15px] font-bold text-ink"
                >
                  <span className="relative z-10 transition-colors group-hover:text-brand">
                    {label}
                  </span>
                  {active ? (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-1 -bottom-1 h-[2px] rounded-full bg-coral-soft"
                    />
                  ) : (
                    <span className="absolute inset-x-1 -bottom-1 h-[2px] origin-left scale-x-0 rounded-full bg-coral-soft/60 transition-transform duration-300 group-hover:scale-x-100" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-1 sm:gap-2">
          {ICON_LINKS.map(({ href, label, Icon }) => (
            <motion.span
              key={href}
              whileHover={{ y: -2, rotate: -8 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 14 }}
            >
              <Link
                href={href}
                aria-label={label}
                className="grid size-9 place-items-center rounded-full text-ink transition-colors hover:bg-brand-light hover:text-brand"
              >
                <Icon className="size-[18px]" strokeWidth={2} />
              </Link>
            </motion.span>
          ))}
          <CartButton />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="ml-1 grid size-9 place-items-center rounded-full bg-brand text-white md:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "x" : "menu"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.ul
            id="mobile-nav"
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="absolute inset-x-4 top-full mt-3 origin-top rounded-3xl bg-white p-3 shadow-xl sm:inset-x-6 md:hidden"
          >
            {NAV_LINKS.map(({ href, label }, i) => {
              const active = isActive(pathname, href);
              return (
                <motion.li
                  key={href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-2xl px-4 py-3 text-base font-bold",
                      active ? "bg-brand-light text-brand" : "text-ink hover:bg-brand-light/60",
                    )}
                  >
                    {label}
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
      </div>
    </motion.header>
  );
}
