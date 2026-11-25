"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { selectCount, selectSubtotal, useCart, type CartItem } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { useCartHydrated } from "./cart-button";
import { useFreeDeliveryOffer } from "@/components/storefront/offer-context";

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const items = useCart((s) => s.items);
  const count = useCart(selectCount);
  const subtotal = useCart(selectSubtotal);
  const hydrated = useCartHydrated();
  const lenis = useLenis();
  const offer = useFreeDeliveryOffer();
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // Lock page scroll, close on Escape, and restore focus when closed.
  useEffect(() => {
    if (!isOpen) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      returnFocus.current?.focus();
    };
  }, [isOpen, close, lenis]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl sm:rounded-l-[32px]"
            data-lenis-prevent
          >
            <header className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <h2 id="cart-title" className="font-display text-2xl font-semibold text-ink">
                Your Cart{" "}
                {hydrated && count > 0 && <span className="text-base text-ink/50">({count})</span>}
              </h2>
              <motion.button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close cart"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.85 }}
                className="grid size-10 place-items-center rounded-full bg-[#F5F6F8] text-ink"
              >
                <X className="size-5" />
              </motion.button>
            </header>

            {!hydrated || items.length === 0 ? (
              <EmptyCart onBrowse={close} />
            ) : (
              <>
                <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <CartLine key={item.productId} item={item} />
                    ))}
                  </AnimatePresence>
                </ul>

                <footer className="border-t border-ink/10 px-6 py-5">
                  <dl className="space-y-1.5 text-[15px]">
                    <div className="flex justify-between">
                      <dt className="text-ink/70">Subtotal</dt>
                      <dd className="font-extrabold text-ink">{formatPrice(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-ink/55">Delivery</dt>
                      {offer.active ? (
                        <dd className="font-bold text-brand">Free until {offer.ends}</dd>
                      ) : (
                        <dd className="text-ink/55">Calculated at checkout</dd>
                      )}
                    </div>
                  </dl>
                  <motion.div whileHover={{ y: -2 }} whileTap={{ y: 4 }} className="mt-5">
                    <Link
                      href="/checkout"
                      onClick={close}
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-coral text-[15px] font-bold text-white shadow-pop"
                    >
                      Checkout
                    </Link>
                  </motion.div>
                  <Link
                    href="/cart"
                    onClick={close}
                    className="mt-3 block text-center text-sm font-bold text-ink/70 underline-offset-4 hover:text-brand hover:underline"
                  >
                    View full cart
                  </Link>
                  <p className="mt-3 text-center text-xs text-ink/45">
                    Guest checkout available. No account needed.
                  </p>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const atMax = item.quantity >= item.stock;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80, height: 0, marginTop: 0, transition: { duration: 0.25 } }}
      className="flex gap-4"
    >
      <Link
        href={`/products/${item.slug}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-[#F5F6F8]"
      >
        {item.image ? (
          <Image src={item.image} alt="" fill sizes="80px" className="object-contain p-2 mix-blend-multiply" />
        ) : (
          <ShoppingBag className="absolute inset-0 m-auto size-7 text-ink/30" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${item.slug}`} className="text-[15px] font-bold leading-snug text-ink hover:text-brand">
            {item.name}
          </Link>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            aria-label={`Remove ${item.name} from cart`}
            className="grid size-8 shrink-0 place-items-center rounded-full text-ink/45 transition-colors hover:bg-coral/10 hover:text-coral"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <p className="text-sm text-ink/55">{formatPrice(item.unitPrice)} each</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center rounded-full bg-[#F5F6F8] p-1">
            <button
              type="button"
              onClick={() => setQuantity(item.productId, item.quantity - 1)}
              aria-label={`Decrease quantity of ${item.name}`}
              className="grid size-7 place-items-center rounded-full bg-white text-ink shadow-sm"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-extrabold tabular-nums" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(item.productId, item.quantity + 1)}
              disabled={atMax}
              aria-label={`Increase quantity of ${item.name}`}
              className="grid size-7 place-items-center rounded-full bg-white text-ink shadow-sm disabled:opacity-40"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <p className="font-extrabold text-ink">{formatPrice(item.unitPrice * item.quantity)}</p>
        </div>
        {atMax && <p className="mt-1 text-xs font-semibold text-[#9A6400]">Max available: {item.stock}</p>}
      </div>
    </motion.li>
  );
}

function EmptyCart({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <motion.div
        initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="grid size-24 place-items-center rounded-full bg-brand-light"
      >
        <ShoppingBag className="size-10 text-brand" />
      </motion.div>
      <h3 className="mt-5 font-display text-xl font-semibold text-ink">Your cart is empty</h3>
      <p className="mt-1.5 text-sm text-ink/60">Little treasures are waiting for you.</p>
      <Link
        href="/shop"
        onClick={onBrowse}
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-coral px-6 text-sm font-bold text-white shadow-pop"
      >
        Start shopping
      </Link>
    </div>
  );
}
