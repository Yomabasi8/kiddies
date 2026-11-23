import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BallPit } from "./ball-pit";
import { Mascot } from "./mascot";
import { NewsletterForm } from "./newsletter-form";
import { Wordmark } from "./wordmark";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All Products" },
      { href: "/categories", label: "Categories" },
      { href: "/shop?sort=newest", label: "New Arrivals" },
      { href: "/shop?on_sale=true", label: "Discounts" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/track-order", label: "Track Order" },
      { href: "/shipping-policy", label: "Shipping Policy" },
      { href: "/returns-policy", label: "Returns Policy" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
    ],
  },
];

// TODO: add business email, phone, address and social links once supplied.
const COPYRIGHT_YEAR = 2026;

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-sunny text-ink">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
        {/* Newsletter */}
        <div className="relative grid items-center gap-6 overflow-hidden rounded-[32px] bg-coral px-6 py-8 sm:px-10 sm:py-10 md:grid-cols-[1fr_1.15fr] md:gap-10">
          <div className="flex items-center gap-5">
            <Mascot className="hidden w-20 shrink-0 sm:block" color="#7B6CF6" />
            <div>
              <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Join the Kiddies Club
              </h2>
              <p className="mt-1.5 text-[15px] text-white/85">
                …be the first to hear about new arrivals and little deals.
              </p>
            </div>
          </div>
          <NewsletterForm />
        </div>

        {/* Wordmark + links */}
        <div className="mt-16 sm:mt-20">
          <Wordmark />
          <p className="mt-4 text-lg font-bold sm:text-xl">Making childhood a little more wonderful.</p>
        </div>

        <nav aria-label="Footer" className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-lg font-semibold">{col.title}</h3>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-1 text-[15px] font-bold text-ink/80 transition-colors hover:text-ink"
                    >
                      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_2px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_2px]">
                        {l.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="font-display text-lg font-semibold">Say hello</h3>
            <p className="mt-3 text-[15px] font-semibold text-ink/75">
              Questions about an order or a product? We&apos;re happy to help.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Contact us
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </nav>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink/10 pt-6 text-sm font-semibold text-ink/70">
          <p>© {COPYRIGHT_YEAR} Kiddies Accessories. All rights reserved.</p>
          <p>Tap the balls below. Go on!</p>
        </div>
      </div>

      <BallPit className="mt-4 block h-[220px] w-full touch-pan-y sm:h-[300px]" />
    </footer>
  );
}
