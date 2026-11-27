"use client";

import { usePathname } from "next/navigation";

/**
 * Pages that stay reachable while the store is closed: customers returning
 * from a payment already in progress must see their confirmation, and
 * existing customers can still track orders.
 */
const ALWAYS_OPEN = ["/order/confirmed", "/track-order"];

/** Swaps the storefront for the maintenance page while the store is closed. */
export function StoreGate({ closed, closedView, children }: { closed: boolean; closedView: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const open = !closed || ALWAYS_OPEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return open ? children : closedView;
}
