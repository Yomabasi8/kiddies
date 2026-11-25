"use client";

import { CreditCard, MapPin, ShieldCheck, Truck } from "lucide-react";
import { useFreeDeliveryOffer } from "./offer-context";

export const ANNOUNCEMENT_HEIGHT = 36;

/**
 * Endless scrolling banner at the very top of the storefront. Only claims
 * the store can stand behind. Pauses on hover; still for reduced motion.
 */
export function AnnouncementBar() {
  const offer = useFreeDeliveryOffer();
  const items = [
    ...(offer.active ? [{ Icon: Truck, text: "Free delivery for your first month of shopping with us" }] : []),
    { Icon: ShieldCheck, text: "Guest checkout, no account needed" },
    { Icon: CreditCard, text: "Secure payments with Paystack" },
    { Icon: MapPin, text: "Delivering across Nigeria" },
  ];
  // Repeat enough to overfill wide screens, then twice for a seamless loop.
  const run = [...items, ...items, ...items];

  return (
    <div
      role="region"
      aria-label="Store announcements"
      className="group relative z-50 overflow-hidden bg-sunny text-ink"
      style={{ height: ANNOUNCEMENT_HEIGHT }}
    >
      <p className="sr-only">{items.map((i) => i.text).join(". ")}.</p>
      <div className="flex h-full w-max animate-[marquee_40s_linear_infinite] items-center group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:justify-center" aria-hidden="true">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center motion-reduce:[&:nth-child(2)]:hidden">
            {run.map(({ Icon, text }, i) => (
              <li key={i} className="flex items-center gap-2 whitespace-nowrap px-6 text-[13px] font-extrabold">
                <Icon className="size-4 shrink-0" strokeWidth={2.4} />
                {text}
                <span className="ml-6 text-coral">✦</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
