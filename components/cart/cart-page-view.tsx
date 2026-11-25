"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { selectSubtotal, useCart, type CartItem } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { EmptyState } from "@/components/storefront/empty-state";
import { useCartHydrated } from "./cart-button";
import { OrderSummaryTotals } from "./order-summary";
import { useFreeDeliveryOffer } from "@/components/storefront/offer-context";

export function CartPageView() {
  const hydrated = useCartHydrated();
  const items = useCart((s) => s.items);
  const subtotal = useCart(selectSubtotal);
  const clear = useCart((s) => s.clear);
  const offer = useFreeDeliveryOffer();

  if (!hydrated) {
    return <div className="h-80 animate-pulse rounded-[32px] bg-ink/[0.04]" aria-busy="true" />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        message="Little treasures are waiting for you. Have a look around the shop."
        action={{ href: "/shop", label: "Start shopping" }}
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <section aria-labelledby="cart-items-heading">
        <div className="flex items-center justify-between">
          <h2 id="cart-items-heading" className="font-display text-2xl font-semibold">
            {items.length} {items.length === 1 ? "item" : "items"}
          </h2>
          <button type="button" onClick={clear} className="text-sm font-bold text-ink/50 underline-offset-4 hover:text-coral hover:underline">
            Clear cart
          </button>
        </div>
        <ul className="mt-6 divide-y-2 divide-ink/5">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <Line key={item.productId} item={item} />
            ))}
          </AnimatePresence>
        </ul>
      </section>

      <aside aria-labelledby="summary-heading" className="h-fit rounded-[32px] border-[3px] border-ink bg-white p-7 shadow-[0_8px_0_0_#1b1b1b] lg:sticky lg:top-32">
        <h2 id="summary-heading" className="font-display text-2xl font-semibold">Order summary</h2>
        <OrderSummaryTotals subtotal={subtotal} delivery={offer.active ? 0 : null} className="mt-6" />
        {offer.active && <p className="mt-2 text-xs font-bold text-brand">Launch offer: free delivery until {offer.ends}.</p>}
        <motion.div whileHover={{ y: -2 }} whileTap={{ y: 4 }} className="mt-7">
          <Link href="/checkout" className="flex h-13 items-center justify-center rounded-xl bg-coral py-3.5 text-[15px] font-bold text-white shadow-pop">
            Proceed to checkout
          </Link>
        </motion.div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-ink/50">
          <ShieldCheck className="size-4" /> Guest checkout available. No account needed.
        </p>
        <p className="mt-4 text-xs leading-relaxed text-ink/45">
          Prices and stock are confirmed again when you check out.
        </p>
      </aside>
    </div>
  );
}

function Line({ item }: { item: CartItem }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const atMax = item.quantity >= item.stock;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60, transition: { duration: 0.2 } }}
      className="flex gap-4 py-6 sm:gap-6"
    >
      <Link href={`/products/${item.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-3xl bg-[#F5F6F8] sm:size-32">
        {item.image ? (
          <Image src={item.image} alt="" fill sizes="128px" className="object-contain p-2 mix-blend-multiply" />
        ) : (
          <ShoppingBag className="absolute inset-0 m-auto size-8 text-ink/25" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/products/${item.slug}`} className="font-bold leading-snug text-ink hover:text-brand sm:text-lg">
              {item.name}
            </Link>
            <p className="mt-0.5 text-sm text-ink/55">{formatPrice(item.unitPrice)} each</p>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            aria-label={`Remove ${item.name}`}
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink/40 hover:bg-coral/10 hover:text-coral"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <div className="flex items-center rounded-full bg-[#F5F6F8] p-1">
            <button type="button" onClick={() => setQuantity(item.productId, item.quantity - 1)} aria-label={`Decrease quantity of ${item.name}`} className="grid size-8 place-items-center rounded-full bg-white shadow-sm">
              <Minus className="size-3.5" />
            </button>
            <span className="w-9 text-center font-extrabold tabular-nums" aria-live="polite">{item.quantity}</span>
            <button type="button" onClick={() => setQuantity(item.productId, item.quantity + 1)} disabled={atMax} aria-label={`Increase quantity of ${item.name}`} className="grid size-8 place-items-center rounded-full bg-white shadow-sm disabled:opacity-40">
              <Plus className="size-3.5" />
            </button>
          </div>
          <p className="text-lg font-extrabold">{formatPrice(item.unitPrice * item.quantity)}</p>
        </div>
        {atMax && <p className="mt-1 text-xs font-semibold text-[#9A6400]">Max available: {item.stock}</p>}
      </div>
    </motion.li>
  );
}
