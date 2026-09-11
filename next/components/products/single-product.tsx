"use client";
import React, { useRef, useState } from "react";
import { Product } from "@/types/types";
import Image from "next/image";
import { IconCheck, IconChevronLeft, IconChevronRight, IconFileText, IconPhoto, IconShoppingCart, IconVideo } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { strapiImage } from "@/lib/strapi/strapiImage";
import { detectMediaKind, mediaLabel } from "@/lib/strapi/media";
import { BuyButton } from "@/components/marketplace/BuyButton";
import { PriceTag } from "@/components/marketplace/PriceTag";
import { CategoryBadge } from "@/components/products/product-card";

function fileTypeLabel(file: any): string {
  const ext = (file?.ext || "").replace(".", "").toUpperCase();
  const mime = file?.mime || "";
  if (mime.includes("pdf") || ext === "PDF") return "PDF";
  return ext || "File";
}

export const SingleProduct = ({ product }: { product: Product }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const images = product.images ?? [];
  const hasMultipleImages = images.length > 1;
  const hasFile = Boolean(product.file);
  const isFree = Number(product.price) === 0;
  const categories = (product.categories ?? []).filter((c) => c && c.name);
  const perks = (product.perks ?? []).filter(Boolean);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = current.clientWidth;

      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });

      const newIndex = direction === 'left' ? Math.max(0, activeIndex - 1) : Math.min(images.length - 1, activeIndex + 1);
      setActiveIndex(newIndex);
    }
  };

  const scrollToImage = (index: number) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = current.clientWidth * index;
      current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
      setActiveIndex(index);
    }
  }

  return (
    <div className="bg-gradient-to-b from-white to-neutral-100 p-4 md:p-10 rounded-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

        {/* LEFT COLUMN: Image Slider */}
        <div>
          <div className="relative group rounded-2xl overflow-hidden border border-border bg-white">
            <div
              ref={scrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth w-full no-scrollbar"
              onScroll={(e) => {
                const scrollLeft = e.currentTarget.scrollLeft;
                const width = e.currentTarget.clientWidth;
                setActiveIndex(Math.round(scrollLeft / width));
              }}
            >
              {images.map((image, index) => {
                const kind = detectMediaKind(image);
                const alt = image?.alternativeText || `${product.name} media ${index + 1}`;

                return (
                  <div key={"slide-" + index} className="w-full flex-shrink-0 snap-center flex justify-center items-center bg-white">
                    {kind === "image" && image?.url ? (
                      <Image
                        src={strapiImage(image.url)}
                        alt={alt}
                        width={image.width || 1200}
                        height={image.height || 1200}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="h-auto w-auto max-h-[480px] max-w-full rounded-lg object-contain"
                        priority={index === 0}
                      />
                    ) : kind === "video" && image?.url ? (
                      <video
                        src={strapiImage(image.url)}
                        controls
                        preload="metadata"
                        className="max-h-[480px] w-full rounded-lg"
                      />
                    ) : kind === "document" ? (
                      <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-2 text-neutral-400">
                        <IconFileText size={48} aria-hidden="true" />
                        <span className="font-secondary text-sm font-semibold uppercase tracking-wide">
                          {mediaLabel(image)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-2 text-neutral-300">
                        <IconPhoto size={48} aria-hidden="true" />
                        <span className="font-secondary text-sm">No preview available</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {images.length === 0 && (
                <div className="w-full flex-shrink-0 snap-center flex flex-col items-center justify-center gap-2 bg-white min-h-[300px] text-neutral-300">
                  <IconShoppingCart size={40} aria-hidden="true" />
                  <span className="font-secondary text-sm">No image available</span>
                </div>
              )}
            </div>

            {hasMultipleImages && (
              <>
                <button
                  onClick={() => scroll('left')}
                  className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-0",
                    activeIndex === 0 && "hidden"
                  )}
                  disabled={activeIndex === 0}
                  aria-label="Previous image"
                >
                  <IconChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-0",
                    activeIndex === images.length - 1 && "hidden"
                  )}
                  disabled={activeIndex === images.length - 1}
                  aria-label="Next image"
                >
                  <IconChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {hasMultipleImages && (
            <div className="flex flex-wrap gap-3 mt-4">
              {images.map((image, index) => {
                const kind = detectMediaKind(image);

                return (
                  <button
                    onClick={() => scrollToImage(index)}
                    key={"product-image" + index}
                    className={cn(
                      "h-16 w-16 rounded-xl flex-shrink-0 transition-all relative overflow-hidden focus-visible:ring-2 focus-visible:ring-brand",
                      activeIndex === index
                        ? "border-2 border-brand"
                        : "border-2 border-transparent"
                    )}
                    aria-label={`View ${mediaLabel(image)} ${index + 1}`}
                  >
                    {kind === "image" && image?.url ? (
                      <span
                        className="block h-full w-full bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${strapiImage(image.url)})` }}
                      />
                    ) : kind === "video" ? (
                      <span className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
                        <IconVideo size={20} aria-hidden="true" />
                      </span>
                    ) : kind === "document" ? (
                      <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-neutral-100 text-neutral-400">
                        <IconFileText size={18} aria-hidden="true" />
                        <span className="text-[8px] font-bold uppercase">{mediaLabel(image)}</span>
                      </span>
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-300">
                        <IconPhoto size={20} aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Details */}
        <div className="flex flex-col">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category, idx) => (
                <CategoryBadge key={`category-${idx}`} label={category.name} />
              ))}
            </div>
          )}

          <h1 className="mt-4 font-primary text-2xl font-bold text-primary md:text-3xl">
            {product.name}
          </h1>

          {product.description && (
            <p className="mt-4 font-secondary text-base leading-relaxed text-neutral-600">
              {product.description}
            </p>
          )}

          {/* Purchase area */}
          <div className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="font-secondary text-sm text-neutral-500">
                {hasFile ? "Digital Product" : "Currently unavailable"}
              </span>
              {hasFile ? (
                <PriceTag price={product.price} className="text-2xl font-bold text-brand" />
              ) : (
                <span className="text-sm font-semibold text-neutral-400">Unavailable</span>
              )}
            </div>

            <BuyButton
              productSlug={product.slug}
              price={product.price}
              hasFile={hasFile}
              className="mt-4 w-full justify-center"
            />

            {hasFile && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <span className="inline-flex items-center rounded-full border border-brand bg-info-bg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  {fileTypeLabel(product.file)}
                </span>
                <span className="font-secondary text-xs text-neutral-500">
                  {isFree ? "Available instantly after claiming" : "Access after purchase"}
                </span>
              </div>
            )}
          </div>

          {perks.length > 0 && (
            <div className="mt-8">
              <h2 className="font-primary text-base font-semibold text-primary">What&apos;s included</h2>
              <ul className="mt-4 space-y-3">
                {perks.map((perk, index) => {
                  const text = typeof perk === 'string' ? perk : perk?.text;
                  if (!text) return null;
                  return (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand">
                        <IconCheck className="h-3 w-3 text-white" strokeWidth={4} />
                      </span>
                      <span className="font-secondary text-sm font-medium text-primary">{text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
