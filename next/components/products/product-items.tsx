import React from "react";
import { Product } from "@/types/types";
import Image from "next/image";
import { truncate } from "@/lib/utils"; // Removed formatNumber since we aren't showing prices
import { Link } from "next-view-transitions";
import { strapiImage } from "@/lib/strapi/strapiImage";

export const ProductItems = ({
  heading = "Our Work",
  sub_heading = "Bridging the gap between complex engineering and impactful design.",
  products,
  locale,
}: {
  heading?: string;
  sub_heading?: string;
  products: Product[];
  locale: string;
}) => {
  
  // 1. FILTER LOGIC: Grouping your projects into the 3 Tracks
  // You can adjust these keywords based on your Strapi data
  const flagshipProjects = products.filter(p => 
    ["PataDawa", "HealthierKE", "PataDoc"].some(k => p.name.includes(k))
  );
  
  const clinicalProjects = products.filter(p => 
    ["AI Symptom", "Tool", "Calculator", "Triage"].some(k => p.name.includes(k))
  );

  const creativeProjects = products.filter(p => 
    ["Media", "Poster", "Brand", "Portfolio", "Content"].some(k => p.name.includes(k))
  );

  // Fallback: If a project doesn't fit a group, put it in 'Other' or just skip
  // ideally, ensure all strapi items match one of these keywords.

  return (
    <div className="py-20 relative">
      {/* Main Header */}
      <div className="text-center mb-20">
        <h2 className="text-3xl md:text-5xl font-bold font-primary text-white mb-4">
          {heading}
        </h2>
        <p className="text-neutral-400 font-secondary text-lg max-w-2xl mx-auto">
          {sub_heading}
        </p>
      </div>

      {/* TRACK 01: Flagship Platforms */}
      <TrackSection 
        title="TRACK 01: FLAGSHIP PLATFORMS" 
        products={flagshipProjects} 
        locale={locale} 
      />

      {/* TRACK 02: Clinical Intelligence */}
      <TrackSection 
        title="TRACK 02: CLINICAL INTELLIGENCE" 
        products={clinicalProjects} 
        locale={locale} 
      />

      {/* TRACK 03: Creative Studio */}
      <TrackSection 
        title="TRACK 03: CREATIVE STUDIO" 
        products={creativeProjects} 
        locale={locale} 
      />

    </div>
  );
};

// 2. REUSABLE SECTION COMPONENT
const TrackSection = ({ title, products, locale }: { title: string, products: Product[], locale: string }) => {
  if (products.length === 0) return null; // Don't show empty sections

  return (
    <div className="mb-24">
      <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4">
        <h3 className="text-xl md:text-2xl font-bold text-white font-primary uppercase tracking-wider">
          {title}
        </h3>
        <div className="h-1 bg-cyan-500 w-20 rounded-full hidden md:block" /> 
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {products.map((product) => (
          <ProductItem
            key={"track-item-" + product.id}
            product={product}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
};

const ProductItem = ({ product, locale }: { product: Product, locale: string }) => {
  // Safe Category Check
  const categoryName = product.categories && product.categories.length > 0 
    ? product.categories[0].name 
    : "Case Study";

  return (
    <Link href={`/${locale}/products/${product.slug}` as never} className="group relative block h-full">
      <div className="relative border border-white/10 rounded-xl overflow-hidden aspect-video bg-neutral-900">
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent opacity-80 z-10" />

        <Image
          src={strapiImage(product.images[0].url)}
          alt={product.name}
          width={600}
          height={400}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
        />
        
        {/* Category Badge Floating on Image */}
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-cyan-500/90 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide backdrop-blur-sm">
            {categoryName}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <h4 className="text-white text-lg font-bold font-primary group-hover:text-cyan-400 transition-colors">
          {product.name}
        </h4>
        <p className="text-neutral-400 text-sm mt-2 font-secondary leading-relaxed line-clamp-2">
          {product.description}
        </p>
      </div>
    </Link>
  );
};