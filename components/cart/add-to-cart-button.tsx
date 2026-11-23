"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { CART_TARGET_ID } from "./cart-button";
import { useCart } from "@/lib/cart-store";
import type { Product } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  /** Element whose position the "fly to cart" animation starts from. */
  sourceRef: React.RefObject<HTMLElement | null>;
  className?: string;
  /** How many to add (product page quantity selector). */
  quantity?: number;
  /** Button text; "Add" on cards, "Add to cart" on the product page. */
  label?: string;
  /** Always show the text, even on small screens. */
  showLabel?: boolean;
};

export function AddToCartButton({
  product,
  sourceRef,
  className,
  quantity = 1,
  label = "Add",
  showLabel = false,
}: Props) {
  const addItem = useCart((s) => s.addItem);
  const launchFlight = useCart((s) => s.launchFlight);
  const openCart = useCart((s) => s.open);
  const reduceMotion = useReducedMotion();
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const soldOut = product.stock <= 0;

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleClick() {
    const result = addItem(product, quantity);

    if (result === "limit") {
      toast.warning(`Only ${product.stock} available`, {
        description: `You already have all of our ${product.name} stock in your cart.`,
      });
      return;
    }
    if (result !== "added") return;

    const source = sourceRef.current;
    const target = document.getElementById(CART_TARGET_ID);
    if (!reduceMotion && source && target) {
      const s = source.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      launchFlight({
        image: product.image,
        from: { x: s.left + s.width / 2, y: s.top + s.height / 2 },
        to: { x: t.left + t.width / 2, y: t.top + t.height / 2 },
      });
    }

    toast.success("Added to cart", {
      description: product.name,
      action: { label: "View cart", onClick: openCart },
    });

    setJustAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={soldOut}
      whileHover={soldOut ? undefined : { scale: 1.06 }}
      whileTap={soldOut ? undefined : { scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
      className={cn(
        "relative inline-flex h-10 items-center justify-center gap-1.5 overflow-hidden rounded-full px-3.5 text-sm font-bold transition-colors sm:px-4",
        soldOut
          ? "cursor-not-allowed bg-ink/10 text-ink/45"
          : justAdded
            ? "bg-brand text-white"
            : "bg-coral text-white shadow-pop-sm hover:bg-[#d94c30]",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {soldOut ? (
          <motion.span key="sold">Sold out</motion.span>
        ) : justAdded ? (
          <motion.span
            key="added"
            className="inline-flex items-center gap-1.5"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <Check className="size-4" strokeWidth={3} />
            <span className={showLabel ? "" : "hidden sm:inline"}>Added</span>
          </motion.span>
        ) : (
          <motion.span
            key="add"
            className="inline-flex items-center gap-1.5"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <ShoppingBag className="size-4" strokeWidth={2.4} />
            <span className={showLabel ? "" : "hidden sm:inline"}>{label}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
