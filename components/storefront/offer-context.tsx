"use client";

import { createContext, useContext } from "react";

type Offer = { active: boolean; days: number };

const OfferContext = createContext<Offer>({ active: false, days: 0 });

/**
 * Shares the new-customer free-delivery offer with storefront components.
 * Display only: the checkout server action decides who actually gets it.
 */
export function OfferProvider({ days, children }: { days: number; children: React.ReactNode }) {
  return <OfferContext value={{ active: days > 0, days }}>{children}</OfferContext>;
}

export const useFreeDeliveryOffer = () => useContext(OfferContext);
