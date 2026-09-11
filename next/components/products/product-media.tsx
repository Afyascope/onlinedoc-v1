"use client";

import Image from "next/image";
import { IconFileText, IconPhoto } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { strapiImage } from "@/lib/strapi/strapiImage";
import { detectMediaKind, mediaLabel } from "@/lib/strapi/media";

interface ProductMediaProps {
  media: any;
  alt: string;
  aspectClassName: string;
  iconSize?: number;
  sizes?: string;
  objectFit?: "cover" | "contain";
  zoom?: boolean;
  className?: string;
}

/**
 * Media-kind-aware presentation used by product cards, the products hero, and
 * any fixed-ratio product visual. Images use next/image; documents render a
 * neutral tile; videos render a controlled <video>; malformed media falls back
 * to a neutral placeholder.
 */
export function ProductMedia({
  media,
  alt,
  aspectClassName,
  iconSize = 32,
  sizes,
  objectFit = "cover",
  zoom = true,
  className,
}: ProductMediaProps) {
  const kind = detectMediaKind(media);
  const url = media?.url;

  return (
    <div className={cn("relative overflow-hidden bg-neutral-100", aspectClassName, className)}>
      {kind === "image" && url ? (
        <Image
          src={strapiImage(url)}
          alt={alt}
          fill
          sizes={sizes}
          className={cn(
            objectFit === "cover" ? "object-cover" : "object-contain",
            "transition-transform duration-300",
            zoom && "group-hover:scale-105"
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
