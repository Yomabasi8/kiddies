import type { DeliveryMethod } from "./delivery";
import { formatPrice } from "./format";

/**
 * DRAFT POLICY CONTENT. Written to match how the platform works, but it is
 * not legal advice: the owner must review and finalise every policy (ideally
 * with a lawyer) before launch. Each page shows a "draft" notice until
 * `finalised` is set to true.
 */

export type Policy = {
  slug: string;
  title: string;
  intro: string;
  updated: string;
  finalised: boolean;
  sections: { heading: string; body: string[] }[];
};

/** Placeholder replaced with live delivery options (see withDeliveryLines). */
export const DELIVERY_LINES = "{{delivery-methods}}";

/** Expand the delivery placeholder using methods from the database. */
export function withDeliveryLines(policy: Policy, methods: DeliveryMethod[]): Policy {
  const lines = methods.map((m) => `${m.label}: ${formatPrice(m.fee)} (${m.description.toLowerCase()}).`);
  return {
    ...policy,
    sections: policy.sections.map((s) => ({ ...s, body: s.body.flatMap((b) => (b === DELIVERY_LINES ? lines : [b])) })),
  };
}

export const POLICIES: Record<string, Policy> = {
  "shipping-policy": {
    slug: "shipping-policy",
    title: "Shipping Policy",
    intro: "How we get your order from our shelves to your door.",
    updated: "November 2026",
    finalised: false,
    sections: [
      { heading: "Where we deliver", body: ["We deliver to addresses across Nigeria. Available delivery options are shown at checkout once you choose your state."] },
      { heading: "Delivery fees and timings", body: [DELIVERY_LINES, "Timings are estimates and start once your payment is confirmed."] },
      { heading: "Order processing", body: ["We start preparing your order once your payment has been verified. You'll receive a confirmation with your order reference, which you can use on our Track Order page."] },
      { heading: "Problems with delivery", body: ["If your order is late, damaged or incorrect, please contact us with your order reference and we'll help put it right."] },
    ],
  },
  "returns-policy": {
    slug: "returns-policy",
    title: "Returns Policy",
    intro: "Not quite right? Here's how returns and refunds work.",
    updated: "November 2026",
    finalised: false,
    sections: [
      { heading: "Returning an item", body: ["Please contact us with your order reference and the item you'd like to return. We'll explain the next steps."] },
      { heading: "Condition of returns", body: ["For hygiene reasons, feeding items such as bottles, cups, cutlery and bibs can only be returned unused and in their original packaging, unless they arrived faulty or damaged."] },
      { heading: "Refunds", body: ["Approved refunds are made to the original payment method through our payment provider. We'll let you know once your refund has been processed."] },
      { heading: "Faulty or incorrect items", body: ["If something arrives faulty, damaged or isn't what you ordered, contact us and we'll arrange a replacement or refund."] },
    ],
  },
  "privacy-policy": {
    slug: "privacy-policy",
    title: "Privacy Policy",
    intro: "What we collect, why we collect it, and how we look after it.",
    updated: "November 2026",
    finalised: false,
    sections: [
      { heading: "What we collect", body: ["When you place an order we collect your name, email address, phone number and delivery address, plus the items you order."] },
      { heading: "Payments", body: ["Payments are handled by our payment provider. We never see or store your full card details."] },
      { heading: "How we use your information", body: ["To process and deliver your order, send order updates and respond to your messages."] },
      { heading: "Your cart", body: ["Your shopping cart is saved in your own browser so it's still there when you come back. It isn't shared with anyone."] },
      { heading: "Your choices", body: ["Contact us at any time to access, correct or delete your personal information."] },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms & Conditions",
    intro: "The terms that apply when you shop with us.",
    updated: "November 2026",
    finalised: false,
    sections: [
      { heading: "Orders", body: ["Your order is confirmed once your payment has been verified. We may cancel and refund an order if an item becomes unavailable or a pricing error occurs."] },
      { heading: "Prices", body: ["Prices are shown in Nigerian Naira (₦). Delivery fees are shown at checkout before you pay."] },
      { heading: "Product safety", body: ["Please follow each product's age guidance and care instructions, and always supervise young children during play and mealtimes."] },
      { heading: "Contact", body: ["If you have any questions about these terms, please get in touch through our Contact page."] },
    ],
  },
};
