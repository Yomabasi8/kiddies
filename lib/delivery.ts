/**
 * Delivery helpers shared by client and server.
 *
 * Live delivery methods come from the `delivery_methods` table (see
 * lib/delivery-data.ts). DELIVERY_METHODS below is only the seed source for
 * `npm run db:seed`: TEMPORARY PLACEHOLDER fees/timings, not the store's
 * real figures. They'll be managed in Admin → Store Settings → Delivery.
 */

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT (Abuja)", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
] as const;

export type DeliveryMethod = {
  id: string;
  label: string;
  description: string;
  /** Fee in kobo. */
  fee: number;
  /** States this method serves; null means everywhere. */
  states: readonly string[] | null;
  isPickup?: boolean;
  /** For pickup: where and when to collect. */
  pickupAddress?: string | null;
  pickupHours?: string | null;
};

/** True while the launch free-delivery offer is running. */
export function freeDeliveryActive(until: string | null | undefined, now = Date.now()) {
  return !!until && new Date(until).getTime() > now;
}

/** What the customer actually pays for this method right now. */
export function chargeFor(method: DeliveryMethod, freeUntil: string | null | undefined, now = Date.now()) {
  return method.isPickup || freeDeliveryActive(freeUntil, now) ? 0 : method.fee;
}

export function formatOfferEnd(until: string) {
  return new Date(until).toLocaleDateString("en-NG", { day: "numeric", month: "long", timeZone: "Africa/Lagos" });
}

/** Seed data only. Do not read at runtime. */
export const DELIVERY_METHODS: DeliveryMethod[] = [
  {
    id: "lagos-standard",
    label: "Standard delivery (Lagos)",
    description: "Estimated 1–3 business days",
    fee: 250000,
    states: ["Lagos"],
  },
  {
    id: "nationwide",
    label: "Nationwide delivery",
    description: "Estimated 3–7 business days",
    fee: 500000,
    states: null,
  },
];

/** Methods that serve the given state (pickup is available everywhere). */
export function deliveryMethodsFor(methods: DeliveryMethod[], state: string | null | undefined) {
  if (!state) return [];
  return methods.filter((m) => m.states === null || m.states.includes(state));
}
