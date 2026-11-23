import type { Category, Product } from "./types";

/**
 * TEMPORARY SAMPLE DATA. Used only until the Supabase catalogue is built.
 *
 * Photos are the owner's, but names, prices and stock levels are
 * placeholders, not the store's real figures. Products with `image: null`
 * render a "photo coming soon" tile until photography is supplied.
 */

export const SAMPLE_CATEGORIES: Category[] = [
  { id: "cat-plates", slug: "feeding-plates-bowls", name: "Feeding Plates & Bowls", image: "/images/products/feeding-set-cream.jpg", icon: "plate", accent: "peach" },
  { id: "cat-cutlery", slug: "spoons-forks-cutlery", name: "Spoons, Forks & Cutlery Sets", image: "/images/products/spoon-fork-set.jpg", icon: "cutlery", accent: "butter" },
  { id: "cat-cups", slug: "cups-water-bottles", name: "Sippy Cups, Straw Cups & Water Bottles", image: "/images/products/straw-cup.jpg", icon: "cup", accent: "blush" },
  { id: "cat-bibs", slug: "bibs-mealtime", name: "Bibs & Mealtime Accessories", image: "/images/products/silicone-bib.jpg", icon: "bib", accent: "lilac" },
  { id: "cat-educational", slug: "educational-toys", name: "Educational Toys", image: "/images/products/shape-sorter-set.png", icon: "educational", accent: "sky" },
  { id: "cat-other", slug: "other-kids-accessories", name: "Other Kids' Accessories", image: "/images/products/plush-teddy-bear.png", icon: "other", accent: "lilac" },
  { id: "cat-bottles", slug: "feeding-bottles", name: "Feeding Bottles", image: null, icon: "bottle", accent: "mint" },
  { id: "cat-lunch", slug: "lunch-boxes-containers", name: "Lunch Boxes & Food Containers", image: null, icon: "lunchbox", accent: "mint" },
  { id: "cat-puzzles", slug: "puzzles-games", name: "Puzzles & Games", image: null, icon: "puzzle", accent: "butter" },
];

const naira = (n: number) => n * 100;

export const SAMPLE_PRODUCTS: Product[] = [
  { id: "p-feeding-rose", slug: "silicone-feeding-set-dusty-rose", name: "8-Piece Silicone Feeding Set, Dusty Rose", categoryId: "cat-plates", price: naira(24000), salePrice: null, stock: 14, image: "/images/products/feeding-set-dusty-rose.jpg", imageStyle: "cutout", ageRange: "6m+", material: "Food-grade silicone", isNew: true, isFeatured: true, createdAt: "2026-11-20" },
  { id: "p-bath-animals", slug: "squeaky-bath-animals-6-piece", name: "Squeaky Bath Animals, 6 Pieces", categoryId: "cat-other", price: naira(9500), salePrice: naira(7900), stock: 18, image: "/images/products/bath-animals-set.jpg", imageStyle: "photo", ageRange: "6m+", material: "Soft vinyl", isNew: false, isFeatured: true, createdAt: "2026-10-22" },
  { id: "p-feeding-cream", slug: "silicone-weaning-set-cream", name: "Silicone Weaning Set, Cream", categoryId: "cat-plates", price: naira(22000), salePrice: null, stock: 10, image: "/images/products/feeding-set-cream.jpg", imageStyle: "cutout", ageRange: "6m+", material: "Silicone, beechwood", isNew: false, isFeatured: true, createdAt: "2026-10-30" },
  { id: "p-hair-clips", slug: "cute-hair-clips-set", name: "Cute Character Hair Clips Set", categoryId: "cat-other", price: naira(5500), salePrice: null, stock: 4, image: "/images/products/hair-clips-set.jpg", imageStyle: "photo", ageRange: "3y+", material: "Plastic, metal clip", isNew: true, isFeatured: true, createdAt: "2026-11-17" },
  { id: "p-shape-sorter", slug: "shape-sorter-cube-ball-set", name: "Shape Sorter Cube & Ball Set", categoryId: "cat-educational", price: naira(14000), salePrice: naira(11900), stock: 9, image: "/images/products/shape-sorter-set.png", imageStyle: "cutout", ageRange: "12m+", material: "BPA-free plastic", isNew: false, isFeatured: true, createdAt: "2026-10-02" },
  { id: "p-feeding-darkpink", slug: "silicone-feeding-set-dark-pink", name: "Silicone Feeding Set with Straw Cup, Dark Pink", categoryId: "cat-plates", price: naira(26000), salePrice: null, stock: 7, image: "/images/products/feeding-set-dark-pink.jpg", imageStyle: "cutout", ageRange: "6m+", material: "Food-grade silicone", isNew: true, isFeatured: true, createdAt: "2026-11-19" },
  { id: "p-straw-cup", slug: "silicone-straw-sippy-cup", name: "Silicone Straw Sippy Cup", categoryId: "cat-cups", price: naira(6500), salePrice: null, stock: 0, image: "/images/products/straw-cup.jpg", imageStyle: "cutout", ageRange: "9m+", material: "Silicone", isNew: false, isFeatured: true, createdAt: "2026-09-18" },
  { id: "p-teddy", slug: "cuddly-plush-teddy-bear", name: "Cuddly Plush Teddy Bear", categoryId: "cat-other", price: naira(18500), salePrice: null, stock: 3, image: "/images/products/plush-teddy-bear.png", imageStyle: "cutout", ageRange: "0m+", material: "Soft plush", isNew: false, isFeatured: true, createdAt: "2026-09-14" },
  { id: "p-cutlery", slug: "silicone-spoon-fork-set", name: "Silicone Spoon & Fork Set", categoryId: "cat-cutlery", price: naira(5200), salePrice: null, stock: 18, image: "/images/products/spoon-fork-set.jpg", imageStyle: "cutout", ageRange: "6m+", material: "Silicone, beechwood", isNew: false, isFeatured: true, createdAt: "2026-05-21" },
  { id: "p-bib", slug: "silicone-catch-all-bib", name: "Silicone Catch-All Bib", categoryId: "cat-bibs", price: naira(4500), salePrice: naira(3800), stock: 30, image: "/images/products/silicone-bib.jpg", imageStyle: "cutout", ageRange: "6m+", material: "Silicone", isNew: false, isFeatured: true, createdAt: "2026-06-05" },
  { id: "p-bottle", slug: "anti-colic-feeding-bottle-260ml", name: "Anti-Colic Feeding Bottle, 260ml", categoryId: "cat-bottles", price: naira(9800), salePrice: null, stock: 25, image: null, imageStyle: "cutout", ageRange: "0m+", material: "PP, silicone teat", isNew: false, isFeatured: true, createdAt: "2026-07-12" },
  { id: "p-lunchbox", slug: "bento-lunch-box", name: "Leakproof Bento Lunch Box", categoryId: "cat-lunch", price: naira(11000), salePrice: null, stock: 12, image: null, imageStyle: "cutout", ageRange: "3y+", material: "PP, silicone seal", isNew: true, isFeatured: true, createdAt: "2026-11-10" },
  // Not on the homepage until photos arrive; kept for the full shop.
  { id: "p-puzzle", slug: "wooden-animal-puzzle", name: "Wooden Animal Puzzle", categoryId: "cat-puzzles", price: naira(8900), salePrice: naira(7500), stock: 4, image: null, imageStyle: "cutout", ageRange: "2y+", material: "Wood", isNew: false, isFeatured: false, createdAt: "2026-04-11" },
  { id: "p-water-bottle", slug: "insulated-kids-water-bottle", name: "Insulated Kids' Water Bottle", categoryId: "cat-cups", price: naira(12500), salePrice: null, stock: 16, image: null, imageStyle: "cutout", ageRange: "3y+", material: "Stainless steel", isNew: false, isFeatured: false, createdAt: "2026-03-28" },
];
