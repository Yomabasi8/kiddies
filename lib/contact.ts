/**
 * Where "Contact us" links go. The owner handles customer enquiries on
 * Instagram, so every Contact link (and the old /contact URL, see
 * next.config.ts) points here. Safe to import from client components.
 */
export const CONTACT_URL = "https://www.instagram.com/kiddiesaccesories/";

/** Spread onto <a>/<Link> so the store stays open in its own tab. */
export const EXTERNAL_LINK = { target: "_blank", rel: "noopener noreferrer" } as const;
