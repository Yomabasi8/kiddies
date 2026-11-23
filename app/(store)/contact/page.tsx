import type { Metadata } from "next";
import Link from "next/link";
import { Package, RotateCcw, Truck } from "lucide-react";
import { PageHeader } from "@/components/storefront/page-header";
import { ContactForm } from "@/components/contact/contact-form";
import { Mascot } from "@/components/storefront/mascot";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Questions about an order or a product? Get in touch with Kiddies Accessories.",
};

// TODO: show business email, phone, WhatsApp and address once supplied.
const HELP = [
  { href: "/track-order", label: "Track an order", text: "Check where your order is with your order reference.", Icon: Truck },
  { href: "/shipping-policy", label: "Shipping & delivery", text: "Delivery areas, fees and timings.", Icon: Package },
  { href: "/returns-policy", label: "Returns", text: "How returns and refunds work.", Icon: RotateCcw },
];

export default function ContactPage() {
  return (
    <main className="flex-1">
      <PageHeader
        title="We're Here to Help"
        intro="Questions about an order, a product or which bottle to pick? Drop us a message."
        crumbs={[{ href: "/", label: "Home" }, { label: "Contact" }]}
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
        <ContactForm />
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
