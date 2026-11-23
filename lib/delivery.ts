/**
 * Delivery configuration.
 *
 * TEMPORARY PLACEHOLDERS: fees and timings are not the store's real figures.
 * They will be managed in Admin → Store Settings → Delivery.
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
};

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

export function deliveryMethodsFor(state: string | null | undefined) {
  if (!state) return [];
  return DELIVERY_METHODS.filter((m) => m.states === null || m.states.includes(state));
}
