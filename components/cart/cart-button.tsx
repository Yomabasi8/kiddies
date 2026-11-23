"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingCart } from "lucide-react";
import { selectCount, useCart } from "@/lib/cart-store";

/** True once the persisted cart has been read from localStorage. */
export function useCartHydrated() {
  return useSyncExternalStore(
    (cb) => useCart.persist.onFinishHydration(cb),
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}

export const CART_TARGET_ID = "cart-target";

export function CartButton() {
  const hydrated = useCartHydrated();
  const count = useCart(selectCount);
  const bump = useCart((s) => s.bump);
  const open = useCart((s) => s.open);
  const shown = hydrated ? count : 0;

  return (
    <motion.button
      id={CART_TARGET_ID}
      type="button"
      onClick={open}
      aria-label={`Open cart, ${shown} ${shown === 1 ? "item" : "items"}`}
      whileHover={{ y: -2, rotate: -8 }}
      whileTap={{ scale: 0.85 }}
      className="relative grid size-9 place-items-center rounded-full text-ink transition-colors hover:bg-brand-light hover:text-brand"
    >
      {/* Re-keyed on every add so the icon does a little hop */}
      <motion.span
        key={bump}
        initial={bump ? { scale: 1.45, rotate: -14 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.55 }}
        className="grid place-items-center"
      >
        <ShoppingCart className="size-[18px]" strokeWidth={2} />
      </motion.span>

      <AnimatePresence>
        {shown > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white"
            aria-hidden="true"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={shown}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
              >
                {shown > 99 ? "99+" : shown}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
