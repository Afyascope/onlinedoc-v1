import Image from "next/image";
import { IconFileText, IconPhoto } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { strapiImage } from "@/lib/strapi/strapiImage";
import { detectMediaKind, mediaLabel } from "@/lib/strapi/media";

interface ArticleMediaProps {
  media: any;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  objectFit?: "cover" | "contain";
  iconSize?: number;
}

/**
 * Media-kind-aware presentation for article visuals (cards, featured, hero).
 * Reuses the Phase F media detection utilities: images render via next/image,
 * videos render a controlled <video>, documents render a neutral file tile,
 * and malformed media falls back to a neutral placeholder.
 */
export function ArticleMedia({
  media,
  alt,
  className,
  sizes,
  priority = false,
  objectFit = "cover",
  iconSize = 40,
}: ArticleMediaProps) {
  const kind = detectMediaKind(media);
  const url = media?.url;

  return (
    <div className={cn("relative overflow-hidden bg-neutral-100", className)}>
      {kind === "image" && url ? (
        <Image
          src={strapiImage(url)}
          alt={alt || media?.alternativeText || ""}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            "transition-transform duration-500 group-hover:scale-105",
            objectFit === "cover" ? "object-cover" : "object-contain"
          )}
        />
      ) : kind === "video" && url ? (
        <video
          src={strapiImage(url)}
          controls
          preload="metadata"
          className="h-full w-full object-cover"
        />
      ) : kind === "document" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-400">
          <IconFileText size={iconSize} aria-hidden="true" />
          <span className="px-3 text-center font-secondary text-xs font-semibold uppercase tracking-wide">
            {mediaLabel(media)}
          </span>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
          <IconPhoto size={iconSize} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
