import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Accent, CategoryIconKey, ImageStyle } from "@/lib/catalog/types";
import { ACCENT_STYLES, CategoryIcon } from "./category-icon";

type Props = {
  image: string | null;
  imageStyle?: ImageStyle;
  alt: string;
  accent: Accent;
  icon: CategoryIconKey;
  sizes: string;
  className?: string;
  imageClassName?: string;
};

/**
 * Product/category artwork on a pastel tile. Falls back to a friendly
 * illustrated placeholder until real photography is uploaded.
 */
export function ProductVisual({
  image,
  imageStyle = "cutout",
  alt,
  accent,
  icon,
  sizes,
  className,
  imageClassName,
}: Props) {
  const style = ACCENT_STYLES[accent];
  const photo = image && imageStyle === "photo";
  return (
    <div className={cn("relative overflow-hidden", style.bg, className)}>
      {/* Soft blob framing the "photo coming soon" icon only; real product
          photos sit on the plain tile colour. */}
      {!image && (
      <svg viewBox="0 0 200 200" className="absolute inset-[12%] size-[76%]" aria-hidden="true">
        <path
          className={style.blob}
          d="M44.7,-58.6C57.1,-50.5,66,-36.5,70.3,-21.1C74.6,-5.7,74.4,11.1,67.6,24.6C60.8,38.1,47.5,48.4,33.1,56.8C18.7,65.2,3.2,71.7,-12.6,70.6C-28.4,69.5,-44.4,60.8,-55.8,48C-67.2,35.2,-73.9,18.3,-73.2,2C-72.5,-14.4,-64.4,-30.1,-52.6,-38.9C-40.8,-47.7,-25.4,-49.6,-10.8,-55.7C3.8,-61.8,32.3,-66.7,44.7,-58.6Z"
          transform="translate(100 100)"
        />
      </svg>
      )}

      {image ? (
        <Image
          src={image}
          alt={alt}
          fill
          sizes={sizes}
          className={cn(
            photo
              ? "object-cover"
              : // Multiply blends white photo backgrounds into the pastel tile.
                "object-contain p-[10%] mix-blend-multiply",
            imageClassName,
          )}
        />
      ) : (
        <div className={cn("absolute inset-0 grid place-items-center", imageClassName)}>
          <div className="flex flex-col items-center gap-2">
            <CategoryIcon icon={icon} className={cn("size-14 sm:size-16", style.ink)} strokeWidth={1.5} />
            <span className={cn("text-xs font-semibold opacity-70", style.ink)}>Photo coming soon</span>
          </div>
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
}
