"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { formatOfferEnd, freeDeliveryActive } from "@/lib/delivery";

type Offer = { active: boolean; until: string | null; ends: string | null };

const OfferContext = createContext<Offer>({ active: false, until: null, ends: null });

const noop = () => () => {};
/** Current time to the minute, read only in the browser (stable between renders). */
const minuteNow = () => Math.floor(Date.now() / 60_000) * 60_000;

/**
 * The browser's clock, or null while pre-rendering on the server (pages are
 * built ahead of time, so the server can't know the visitor's "now").
 */
export function useNow(): number | null {
  return useSyncExternalStore(noop, minuteNow, () => null);
}

/**
 * Shares the launch free-delivery offer with storefront components. Display
 * only: the checkout server action decides what is actually charged.
 */
export function OfferProvider({ until, children }: { until: string | null; children: React.ReactNode }) {
  const now = useNow();
  // While pre-rendering, show the offer if one is set; the browser corrects it.
  const active = now === null ? !!until : freeDeliveryActive(until, now);
  return (
    <OfferContext value={{ active, until, ends: active && until ? formatOfferEnd(until) : null }}>
      {children}
    </OfferContext>
  );
}

export const useFreeDeliveryOffer = () => useContext(OfferContext);
