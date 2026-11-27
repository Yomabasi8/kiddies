import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, MessageCircle, MessageCircleHeart, Package, Phone, RotateCcw, Truck } from "lucide-react";
import { PageHeader } from "@/components/storefront/page-header";
import { Mascot } from "@/components/storefront/mascot";
import { getStoreSettings } from "@/lib/store-settings";
import { CONTACT_URL, EXTERNAL_LINK } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Questions about an order or a product? Message Kiddies Accessories on Instagram.",
};

const HELP = [
  { href: "/track-order", label: "Track an order", text: "Check where your order is with your order reference.", Icon: Truck },
  { href: "/shipping-policy", label: "Shipping & delivery", text: "Delivery areas, fees and timings.", Icon: Package },
  { href: "/returns-policy", label: "Returns", text: "How returns and refunds work.", Icon: RotateCcw },
];

/**
 * Enquiries are handled on Instagram (lib/contact.ts). Email, phone,
 * WhatsApp and address appear here once set in Admin → Store Settings.
 */
export default async function ContactPage() {
  const store = await getStoreSettings();
  const details = [
    store.whatsapp && {
      href: `https://wa.me/${store.whatsapp.replace(/\D/g, "").replace(/^0/, "234")}`,
      label: "WhatsApp",
      Icon: MessageCircle,
      external: true,
    },
    store.phone && { href: `tel:${store.phone.replace(/\s/g, "")}`, label: store.phone, Icon: Phone },
    store.email && { href: `mailto:${store.email}`, label: store.email, Icon: Mail },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof Mail; external?: boolean }[];

  return (
    <main className="flex-1">
      <PageHeader
        title="We're Here to Help"
        intro="Questions about an order, a product or which bottle to pick? Send us a message."
        crumbs={[{ href: "/", label: "Home" }, { label: "Contact" }]}
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="message-us" className="rounded-[32px] bg-brand p-8 text-white sm:p-10">
          <span className="grid size-14 place-items-center rounded-2xl bg-white/15">
            <MessageCircleHeart className="size-7" />
          </span>
          <h2 id="message-us" className="mt-6 font-display text-3xl font-semibold">Message us on Instagram</h2>
          <p className="mt-3 max-w-md text-[15px] text-white/80">
            Send us a DM on Instagram. If it&apos;s about an order, include your order reference (it starts with KA-) so we can find it quickly.
          </p>
          <a
            href={CONTACT_URL}
            {...EXTERNAL_LINK}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-coral px-7 text-sm font-bold text-white shadow-pop transition-transform hover:-translate-y-0.5"
          >
            Open Instagram
            <ArrowUpRight className="size-4" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>

          {(details.length > 0 || store.address) && (
            <ul className="mt-8 space-y-2 border-t border-white/15 pt-6 text-[15px] font-semibold text-white/85">
              {details.map(({ href, label, Icon, external }) => (
                <li key={href}>
                  <a href={href} {...(external ? EXTERNAL_LINK : {})} className="inline-flex items-center gap-2 hover:text-white">
                    <Icon className="size-4" /> {label}
                  </a>
                </li>
              ))}
              {store.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" /> {store.address}
                </li>
              )}
            </ul>
          )}
        </section>

        <div>
          <Mascot className="w-24" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Quick answers</h2>
          <ul className="mt-6 space-y-4">
            {HELP.map(({ href, label, text, Icon }) => (
              <li key={href}>
                <Link href={href} className="group flex gap-4 rounded-3xl bg-[#FDF8E9] p-5 transition-transform hover:-translate-y-1">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sunny">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-bold group-hover:text-brand">{label}</span>
                    <span className="text-sm text-ink/60">{text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
