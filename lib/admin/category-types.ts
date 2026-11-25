/** Shared category form types/options (kept out of the "use server" file). */

export const CATEGORY_ICONS = ["plate", "cutlery", "bottle", "cup", "bib", "lunchbox", "educational", "puzzle", "book", "bath", "other"] as const;
export const CATEGORY_ACCENTS = ["mint", "peach", "sky", "butter", "lilac", "blush"] as const;

export type CategoryFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imageStyle: "cutout" | "photo";
  icon: string;
  accent: string;
  isVisible: boolean;
  sortOrder: string;
};
