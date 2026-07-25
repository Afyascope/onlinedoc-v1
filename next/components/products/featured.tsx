import React from "react";
import Image from "next/image";
import { Link } from "next-view-transitions";
import { Product } from "@/types/types";
import { strapiImage } from "@/lib/strapi/strapiImage";

export const Featured = ({ products, locale }: { products: Product[], locale: string }) => {
  // Safety check to ensure we don't crash if fewer than 3 products exist
  if (!products || products.length === 0) return null;

  return (
    <div className="py-20 relative">
      {/* Header */}
      <div className="mb-12">
        <h2 className="text-3xl md:text-5xl font-bold font-primary text-white mb-4">
          Featured Innovations
        </h2>
        <p className="text-neutral-400 font-secondary text-lg max-w-2xl">
          Highlights from our digital health ecosystem.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Large Item (Takes up 2 Columns) */}
        {products[0] && (
          <div className="md:col-span-2 relative min-h-[400px]">
            <FeaturedItem product={products[0]} locale={locale} />
          </div>
        )}

        {/* Stacked Items (Right Column) */}
        <div className="grid gap-8 h-full">
          {products[1] && <FeaturedItem product={products[1]} locale={locale} />}
          {products[2] && <FeaturedItem product={products[2]} locale={locale} />}
        </div>
      </div>
    </div>
  );
};

const FeaturedItem = ({ product, locale }: { product: Product, locale: string }) => {
  // Safe Category Check
  const categoryName = product.categories && product.categories.length > 0
    ? product.categories[0].name
    : "Showcase";

  return (
    <Link
      href={`/${locale}/products/${product.slug}` as never}
      className="group border border-white/10 rounded-2xl overflow-hidden relative block h-full w-full"
    >
      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/10 to-transparent opacity-80 z-10 transition-opacity duration-300 group-hover:opacity-60" />

      {/* Floating Badge (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Project Name Pill */}
        <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
           {product.name}
        </span>
        {/* Category Pill */}
        <span className="bg-cyan-500 text-black text-[10px] font-bold px-2 py-1.5 rounded-full uppercase tracking-wide shadow-lg">
          {categoryName}
        </span>
      </div>

      {/* Image */}
      <Image
        src={strapiImage(product.images[0].url)}
        alt={product.name}
        width={1000}
        height={1000}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
    </Link>
  );
};