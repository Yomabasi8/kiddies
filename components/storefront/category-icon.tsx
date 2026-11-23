import {
  Baby,
  Blocks,
  CupSoda,
  Milk,
  Puzzle,
  Sandwich,
  Shirt,
  Soup,
  Utensils,
  type LucideProps,
} from "lucide-react";
import type { Accent, CategoryIconKey } from "@/lib/catalog/types";

const ICONS: Record<CategoryIconKey, React.ComponentType<LucideProps>> = {
  plate: Soup,
  cutlery: Utensils,
  bottle: Milk,
  cup: CupSoda,
  bib: Shirt,
  lunchbox: Sandwich,
  educational: Blocks,
  puzzle: Puzzle,
  other: Baby,
};

export function CategoryIcon({ icon, ...props }: { icon: CategoryIconKey } & LucideProps) {
  const Icon = ICONS[icon];
  return <Icon aria-hidden="true" {...props} />;
}

/** Pastel background + matching ink colour for each accent. */
export const ACCENT_STYLES: Record<Accent, { bg: string; ink: string; blob: string }> = {
  mint: { bg: "bg-[#E3F5EF]", ink: "text-[#2F8F73]", blob: "fill-[#C9EBDF]" },
  peach: { bg: "bg-[#FFEDE6]", ink: "text-[#D9603F]", blob: "fill-[#FFD9CB]" },
  sky: { bg: "bg-[#E6F1FB]", ink: "text-[#3D7CC9]", blob: "fill-[#CFE3F7]" },
  butter: { bg: "bg-[#FFF6D9]", ink: "text-[#C08A00]", blob: "fill-[#FFEBA8]" },
  lilac: { bg: "bg-[#F0EBFA]", ink: "text-[#7A5CC2]", blob: "fill-[#E0D6F5]" },
  blush: { bg: "bg-[#FDE9F0]", ink: "text-[#C94F7C]", blob: "fill-[#F9D2E0]" },
};
