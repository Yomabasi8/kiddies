"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useCart } from "@/lib/cart-store";

/** Empties the cart after a confirmed payment, with a small celebration. */
export function ClearCartOnSuccess() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.35 },
      colors: ["#e8573a", "#f7e14b", "#086f54", "#a5ddcf", "#f28b7b"],
      disableForReducedMotion: true,
    });
  }, [clear]);
  return null;
}
