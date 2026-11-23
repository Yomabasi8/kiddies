import type { Metadata } from "next";
import Link from "next/link";
import { Baby, HeartHandshake, ShoppingBag, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/storefront/page-header";
import { AboutMosaic } from "@/components/storefront/about-mosaic";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Kiddies Accessories is an online store in Nigeria for practical baby and children's essentials: feeding sets, bottles, mealtime accessories and toys.",
};

// TODO: replace with the owner's own story once supplied.
const VALUES = [
  { title: "Practical first", text: "Everyday essentials that make mealtimes, playtime and days out a little easier.", Icon: Baby, color: "bg-[#E3F5EF]" },
  { title: "Thoughtfully chosen", text: "Products picked with little hands, little mouths and busy parents in mind.", Icon: Sparkles, color: "bg-[#FFF6D9]" },
  { title: "Easy to shop", text: "Browse, add to cart and check out as a guest. No account needed.", Icon: ShoppingBag, color: "bg-[#FFEDE6]" },
  { title: "Here to help", text: "Questions about an order or a product? We're a message away.", Icon: HeartHandshake, color: "bg-[#F0EBFA]" },
];

export default function AboutPage() {
  return (
    <main className="flex-1">
      <PageHeader
        title="About Kiddies Accessories"
        intro="Making childhood a little more wonderful, one spoonful and one playtime at a time."
        crumbs={[{ href: "/", label: "Home" }, { label: "About us" }]}
      />

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-6 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-[15px] font-semibold text-coral">Our story</p>
          <h2 className="mt-1 font-display text-3xl font-semibold leading-tight sm:text-[2.5rem]">A happy place for little essentials</h2>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink/75">
            <p>
              Kiddies Accessories is an online store for practical baby and children&apos;s essentials in Nigeria. We bring together the things families reach for every day: feeding plates and bowls, spoons and cutlery sets, bottles and cups, bibs, lunch boxes, and toys that make learning fun.
            </p>
            <p>
              Whether you&apos;re a parent, a guardian, a proud aunty or shopping for a gift, we want finding the right thing to feel easy and joyful.
            </p>
          </div>
          <Link href="/shop" className="mt-8 inline-flex h-12 items-center rounded-full bg-coral px-8 text-[15px] font-bold text-white shadow-pop transition-transform hover:-translate-y-0.5">
            Start shopping
          </Link>
        </div>
        <AboutMosaic />
      </section>

      <section className="bg-[#FDF8E9] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-semibold sm:text-[2.5rem]">What we care about</h2>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ title, text, Icon, color }) => (
              <li key={title} className="rounded-[28px] border-[3px] border-ink bg-white p-6 shadow-[0_6px_0_0_#1b1b1b] transition-transform hover:-translate-y-1">
                <span className={`grid size-14 place-items-center rounded-2xl ${color}`}>
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-[15px] text-ink/65">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
