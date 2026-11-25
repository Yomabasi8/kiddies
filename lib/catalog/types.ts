/**
 * Catalogue types. These mirror the planned database model (categories,
 * products, product attributes) so the sample data can be swapped for
 * Supabase queries without touching the UI.
 */

/** Icon keys rendered by <CategoryIcon>. */
export type CategoryIconKey =
  | "plate"
  | "cutlery"
  | "bottle"
  | "cup"
  | "bib"
  | "lunchbox"
  | "educational"
  | "puzzle"
  | "book"
  | "bath"
  | "other";

/**
 * How an image is presented: "cutout" images sit on a white or transparent
 * background and are blended onto a pastel tile; "photo" images are full
 * scenes that fill the tile.
 */
export type ImageStyle = "cutout" | "photo";

/** Pastel accent used behind category and product imagery. */
export type Accent = "mint" | "peach" | "sky" | "butter" | "lilac" | "blush";

export type Category = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  icon: CategoryIconKey;
  accent: Accent;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  /** Price in kobo (minor units) to avoid floating-point errors. */
  price: number;
  /** Discounted price in kobo, when on sale. */
  salePrice: number | null;
  stock: number;
  image: string | null;
  imageStyle: ImageStyle;
  ageRange: string | null;
  material: string | null;
  isNew: boolean;
  isFeatured: boolean;
  createdAt: string;
};

export type CategoryWithCount = Category & { productCount: number };

export type ProductSpec = { label: string; value: string };

/** Full product record for the product details page. */
export type ProductDetail = Product & {
  sku: string;
  description: string;
  /** Extra images after the primary one. */
  gallery: { src: string; alt: string; style: ImageStyle }[];
  specs: ProductSpec[];
  careInstructions: string | null;
};

export type ShopSort = "featured" | "newest" | "price-asc" | "price-desc" | "popular";

export type ShopQuery = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Child's age in months; returns products suitable from that age. */
  ageMonths?: number;
  material?: string;
  inStock?: boolean;
  onSale?: boolean;
  sort?: ShopSort;
  page?: number;
};

export type ShopResult = {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
};
