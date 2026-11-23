"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Product } from "@/lib/catalog/types";

/**
 * Client cart. Persists in localStorage so guest carts survive across
 * browser sessions. Prices and stock stored here are a display snapshot
 * only: checkout must re-validate both on the server.
 */

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  /** Unit price in kobo at the time it was added (sale price if on sale). */
  unitPrice: number;
  stock: number;
  quantity: number;
};

/** An in-flight "fly to cart" animation. */
export type Flight = {
  id: number;
  image: string | null;
  /** Centre points in viewport coordinates. */
  from: { x: number; y: number };
  to: { x: number; y: number };
};

type AddResult = "added" | "limit" | "sold-out";

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  flights: Flight[];
  /** Increments on every add so the cart icon can bounce. */
  bump: number;

  addItem: (product: Product, quantity?: number) => AddResult;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;

  open: () => void;
  close: () => void;

  launchFlight: (flight: Omit<Flight, "id">) => void;
  landFlight: (id: number) => void;
};

let flightId = 0;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      flights: [],
      bump: 0,

      addItem: (product, quantity = 1) => {
        if (product.stock <= 0) return "sold-out";
        const existing = get().items.find((i) => i.productId === product.id);
        const current = existing?.quantity ?? 0;
        const next = Math.min(current + quantity, product.stock);
        if (next === current) return "limit";

        const unitPrice = product.salePrice ?? product.price;
        set((s) => ({
          bump: s.bump + 1,
          items: existing
            ? s.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: next, unitPrice, stock: product.stock }
                  : i,
              )
            : [
                ...s.items,
                {
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  image: product.image,
                  unitPrice,
                  stock: product.stock,
                  quantity: next,
                },
              ],
        }));
        return "added";
      },

      setQuantity: (productId, quantity) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.max(0, Math.min(quantity, i.stock)) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),

      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),

      clear: () => set({ items: [] }),

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      launchFlight: (flight) =>
        set((s) => ({ flights: [...s.flights, { ...flight, id: ++flightId }] })),
      landFlight: (id) => set((s) => ({ flights: s.flights.filter((f) => f.id !== id) })),
    }),
    {
      name: "kiddies-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
      // Hydrate after mount to avoid server/client markup mismatches.
      skipHydration: true,
    },
  ),
);

export const selectCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectSubtotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
