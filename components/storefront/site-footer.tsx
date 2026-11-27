import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getStoreSettings } from "@/lib/store-settings";
import { CONTACT_URL, EXTERNAL_LINK } from "@/lib/contact";
import { BallPit } from "./ball-pit";
import { Wordmark } from "./wordmark";

const COLUMNS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
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
      { href: CONTACT_URL, label: "Contact Us", external: true },
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

// Contact details and socials come from Admin → Store Settings.
const COPYRIGHT_YEAR = 2026;

export async function SiteFooter() {
  const store = await getStoreSettings();
  const socials = Object.entries(store.socials ?? {}).filter(([, url]) => url) as [string, string][];
  const SOCIAL_LABEL: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", x: "X" };
  return (
    <footer className="relative overflow-hidden bg-sunny text-ink">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
        {/* Wordmark + links */}
        <div className="mt-10 sm:mt-14">
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
                      {...(l.external ? EXTERNAL_LINK : {})}
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
              href={CONTACT_URL}
              {...EXTERNAL_LINK}
              className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Contact us
              <ArrowUpRight className="size-4" />
            </Link>
            {(store.email || store.phone || store.whatsapp || store.address) && (
              <ul className="mt-5 space-y-2 text-[15px] font-semibold text-ink/80">
                {store.email && <li><a href={`mailto:${store.email}`} className="inline-flex items-center gap-2 hover:text-ink"><Mail className="size-4" /> {store.email}</a></li>}
                {store.phone && <li><a href={`tel:${store.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 hover:text-ink"><Phone className="size-4" /> {store.phone}</a></li>}
                {store.whatsapp && (
                  <li>
                    <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "").replace(/^0/, "234")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-ink">
                      <MessageCircle className="size-4" /> WhatsApp
                    </a>
                  </li>
                )}
                {store.address && <li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" /> {store.address}</li>}
              </ul>
            )}
            {socials.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Social media">
                {socials.map(([k, url]) => (
                  <li key={k}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-full border-2 border-ink px-3.5 text-sm font-bold hover:bg-ink hover:text-white">
                      {SOCIAL_LABEL[k] ?? k}
                    </a>
                  </li>
                ))}
              </ul>
            )}
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
