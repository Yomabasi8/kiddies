import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/lib/catalog";

// TODO: set NEXT_PUBLIC_SITE_URL to the production domain.
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC = [
  "", "/shop", "/categories", "/about", "/track-order",
  "/shipping-policy", "/returns-policy", "/privacy-policy", "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllProductSlugs();
  return [
    ...STATIC.map((path) => ({ url: `${BASE}${path}` })),
    ...slugs.map((slug) => ({ url: `${BASE}/products/${slug}` })),
  ];
}
