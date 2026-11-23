import type { ImageStyle, ProductSpec } from "./types";

/**
 * TEMPORARY SAMPLE PRODUCT DETAILS, keyed by product id. Descriptions only
 * describe what the photos show; SKUs and specs are placeholders until the
 * owner supplies real product data through the admin dashboard.
 */
type Detail = {
  sku: string;
  description: string;
  gallery?: { src: string; alt: string; style: ImageStyle }[];
  specs?: ProductSpec[];
  careInstructions?: string;
};

export const SAMPLE_DETAILS: Record<string, Detail> = {
  "p-feeding-rose": {
    sku: "KA-FS-ROSE",
    description:
      "A complete mealtime set in a soft dusty rose: a divided plate, a bowl, a straw cup with lid, a catch-all bib and little spoons and forks sized for small hands.",
    gallery: [
      { src: "/images/products/straw-cup.png", alt: "Straw cup from the dusty rose set", style: "cutout" },
    ],
    specs: [
      { label: "Pieces", value: "8" },
      { label: "Colour", value: "Dusty rose" },
    ],
    careInstructions: "Wash in warm soapy water before first use. Rinse and air dry.",
  },
  "p-feeding-cream": {
    sku: "KA-FS-CREAM",
    description:
      "A neutral cream weaning set with a divided plate, bowl, sippy cup, bib, and spoons and forks with wooden handles.",
    gallery: [
      { src: "/images/products/spoon-fork-set.png", alt: "Spoons and forks from the cream set", style: "cutout" },
    ],
    specs: [{ label: "Colour", value: "Cream" }],
    careInstructions: "Wash in warm soapy water. Do not soak the wooden handles.",
  },
  "p-feeding-darkpink": {
    sku: "KA-FS-PINK",
    description:
      "A bright dark pink feeding set with a divided plate, bowl, straw cup, bib, and two sets of spoons and forks.",
    gallery: [
      { src: "/images/products/silicone-bib.png", alt: "Bib from the dark pink set", style: "cutout" },
    ],
    specs: [
      { label: "Pieces", value: "8" },
      { label: "Colour", value: "Dark pink" },
    ],
    careInstructions: "Wash in warm soapy water before first use. Rinse and air dry.",
  },
  "p-bath-animals": {
    sku: "KA-BATH-6",
    description: "Six colourful squeaky bath friends: a seal, hippo, frog, duck, octopus and dolphin.",
    specs: [{ label: "Pieces", value: "6" }],
    careInstructions: "Squeeze out water after each bath and leave to dry.",
  },
  "p-hair-clips": {
    sku: "KA-CLIPS",
    description: "A cheerful set of character hair clips in pinks and purples, with flowers, bunnies and fruit.",
    careInstructions: "Wipe clean with a damp cloth. Keep away from babies and toddlers who may put them in their mouths.",
  },
  "p-shape-sorter": {
    sku: "KA-SORT-CUBE",
    description: "A shape sorter cube and matching ball with colourful chunky shapes to post through the holes.",
    careInstructions: "Wipe clean with a damp cloth.",
  },
  "p-straw-cup": {
    sku: "KA-CUP-STRAW",
    description: "A two-handled straw cup with a snug lid, in a soft dusty rose.",
    specs: [{ label: "Colour", value: "Dusty rose" }],
    careInstructions: "Wash the cup, lid and straw in warm soapy water after each use.",
  },
  "p-teddy": {
    sku: "KA-TEDDY-L",
    description: "A big, huggable purple teddy bear with a checked bow tie.",
    careInstructions: "Surface wash only.",
  },
  "p-cutlery": {
    sku: "KA-CUT-4",
    description: "Two spoons and two forks with soft silicone tips, two with wooden handles.",
    specs: [{ label: "Pieces", value: "4" }],
    careInstructions: "Wash in warm soapy water. Do not soak the wooden handles.",
  },
  "p-bib": {
    sku: "KA-BIB",
    description: "A soft bib with an adjustable neck strap and a deep pocket to catch spills.",
    careInstructions: "Rinse after use or wipe clean.",
  },
  "p-bottle": { sku: "KA-BOT-260", description: "A 260ml feeding bottle.", specs: [{ label: "Capacity", value: "260ml" }] },
  "p-lunchbox": { sku: "KA-LUNCH", description: "A bento-style lunch box with separate compartments." },
  "p-puzzle": { sku: "KA-PUZ-ANIMAL", description: "A wooden animal puzzle." },
  "p-water-bottle": { sku: "KA-WB", description: "An insulated water bottle for school and days out." },
};
