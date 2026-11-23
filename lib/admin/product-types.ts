/**
 * Product types and which attributes apply to each. The product form shows
 * only the relevant fields; inapplicable attributes may be left blank.
 */
export const PRODUCT_TYPES = [
  { value: "plate", label: "Plate" },
  { value: "bowl", label: "Bowl" },
  { value: "feeding-set", label: "Feeding set" },
  { value: "cutlery", label: "Cutlery set" },
  { value: "bottle", label: "Feeding bottle" },
  { value: "cup", label: "Cup / water bottle" },
  { value: "bib", label: "Bib" },
  { value: "lunch-box", label: "Lunch box / container" },
  { value: "toy", label: "Toy" },
  { value: "puzzle", label: "Puzzle / game" },
  { value: "accessory", label: "Other accessory" },
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number]["value"];

export const SHOWS_CAPACITY: ProductType[] = ["bottle", "cup"];
export const SHOWS_DIMENSIONS: ProductType[] = ["plate", "bowl", "feeding-set", "lunch-box"];
export const SHOWS_PIECES: ProductType[] = ["feeding-set", "cutlery", "puzzle", "toy"];

export type ProductFormImage = { url: string; alt: string; style: "cutout" | "photo"; isPrimary: boolean };

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  productType: string;
  sku: string;
  ageRange: string;
  material: string;
  capacityMl: string;
  dimensions: string;
  pieceCount: string;
  careInstructions: string;
  specs: { label: string; value: string }[];
  images: ProductFormImage[];
  /** Naira, as typed. */
  price: string;
  salePrice: string;
  trackInventory: boolean;
  stock: string;
  lowStockThreshold: string;
  isFeatured: boolean;
  isNew: boolean;
  status: "draft" | "active" | "archived";
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** Short SKU codes per product type, e.g. bottle → BOT. */
const TYPE_CODES: Record<string, string> = {
  plate: "PLT", bowl: "BWL", "feeding-set": "FS", cutlery: "CUT", bottle: "BOT", cup: "CUP",
  bib: "BIB", "lunch-box": "LUNCH", toy: "TOY", puzzle: "PUZ", accessory: "ACC",
};

/** Pure filler words, never useful in a SKU. */
const FILLER = new Set(["a", "an", "and", "the", "with", "for", "of", "in", "set", "sets", "piece", "pieces", "pcs"]);

/** Words that describe the type/material rather than what makes a product unique. */
const GENERIC = new Set([
  "a", "an", "and", "the", "with", "for", "of", "in", "kids", "kid", "baby", "babies", "toddler", "children",
  "set", "sets", "piece", "pieces", "pcs", "feeding", "bottle", "bottles", "cup", "cups", "plate", "plates",
  "bowl", "bowls", "bib", "bibs", "box", "lunch", "toy", "toys", "puzzle", "spoon", "fork", "cutlery",
  "silicone", "plastic", "wooden", "wood", "steel", "stainless",
]);

/**
 * Build a readable SKU base: KA-<TYPE>-<DISTINCTIVE WORDS>[-<CAPACITY>].
 * "Silicone Feeding Set, Cream" (feeding-set) → KA-FS-CREAM
 * "Anti-Colic Feeding Bottle" (bottle, 260ml) → KA-BOT-ANTI-COLIC-260
 */
export function buildSkuBase(name: string, productType: string, capacityMl?: string) {
  const type = TYPE_CODES[productType] ?? "GEN";
  const all = name
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[^A-Z0-9 -]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w && !/^\d+ML$/.test(w));
  const distinctive = all.filter((w) => !GENERIC.has(w.toLowerCase()));
  // If every word is generic ("Silicone Spoon & Fork Set"), fall back to the
  // name's own words minus filler, so the code stays meaningful.
  const words = (distinctive.length ? distinctive : all.filter((w) => !FILLER.has(w.toLowerCase())))
    .slice(0, 2)
    .map((w) => w.slice(0, 10));
  const capacity = capacityMl && /^\d+$/.test(capacityMl.trim()) ? [capacityMl.trim()] : [];
  return ["KA", type, ...(words.length ? words : ["ITEM"]), ...capacity].join("-").slice(0, 34);
}
