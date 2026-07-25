"use client";
import React, { useRef, useState } from "react";
import { Product } from "@/types/types";
import Image from "next/image";
import { IconCheck, IconArrowRight, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { strapiImage } from "@/lib/strapi/strapiImage";
import { Link } from "next-view-transitions";

export const SingleProduct = ({ product }: { product: Product }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const hasMultipleImages = product.images && product.images.length > 1;

  // Scroll Handler
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      // Scroll by the width of the container (one slide)
      const scrollAmount = current.clientWidth;
      
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      
      const newIndex = direction === 'left' ? Math.max(0, activeIndex - 1) : Math.min(product.images.length - 1, activeIndex + 1);
      setActiveIndex(newIndex);
    }
  };

  // Thumbnail Click Handler
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
  
  const categoryName = product.categories && product.categories.length > 0 
    ? product.categories[0].name 
    : "Case Study";

  return (
    <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 p-4 md:p-10 rounded-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* LEFT COLUMN: Image Slider */}
        <div>
          {/* Slider Container */}
          <div className="relative group rounded-lg overflow-hidden">
            
            <div 
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth w-full no-scrollbar"
                onScroll={(e) => {
                    const scrollLeft = e.currentTarget.scrollLeft;
                    const width = e.currentTarget.clientWidth;
                    setActiveIndex(Math.round(scrollLeft / width));
                }}
            >
                {product.images.map((image, index) => (
                    <div key={"slide-" + index} className="w-full flex-shrink-0 snap-center flex justify-center items-center bg-neutral-900/50">
                         {/* RESTORED: Specific width/height to prevent zoom */}
                         <Image
                          src={strapiImage(image.url)}
                          alt={`${product.name} view ${index + 1}`}
                          width={600}
                          height={600}
                          className="rounded-lg object-cover"
                          priority={index === 0}
                        />
                    </div>
                ))}
            </div>

            {/* Navigation Arrows (Only show if multiple images) */}
            {hasMultipleImages && (
                <>
                  <button 
                    onClick={() => scroll('left')}
                    className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0",
                        activeIndex === 0 && "hidden"
                    )}
                    disabled={activeIndex === 0}
                  >
                    <IconChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => scroll('right')}
                     className={cn(
                        "absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0",
                        activeIndex === product.images.length - 1 && "hidden"
                    )}
                    disabled={activeIndex === product.images.length - 1}
                  >
                    <IconChevronRight className="w-6 h-6" />
                  </button>
                </>
            )}
          </div>
          
          {/* Thumbnails */}
          {hasMultipleImages && (
            <div className="flex gap-4 justify-center items-center mt-4">
              {product.images.map((image, index) => (
                <button
                  onClick={() => scrollToImage(index)}
                  key={"product-image" + index}
                  className={cn(
                    "h-20 w-20 rounded-xl flex-shrink-0 transition-all relative overflow-hidden",
                    activeIndex === index
                      ? "border-2 border-neutral-200"
                      : "border-2 border-transparent"
                  )}
                  style={{
                    backgroundImage: `url(${strapiImage(image.url)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Details */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-white">{product.name}</h2>
          
          {/* Category Pill (Replaces Price) */}
          <p className="mb-6 bg-cyan-500/10 border border-cyan-500/20 text-xs px-4 py-1 rounded-full text-cyan-400 w-fit font-bold uppercase tracking-wider">
            {categoryName}
          </p>
          
          <p className="text-base font-normal mb-4 text-neutral-400">
            {product.description}
          </p>

          <Divider />
          
          <ul className="list-disc list-inside mb-6">
            {product.perks && product.perks.map((perk, index) => (
              <Step key={index}>{typeof perk === 'string' ? perk : perk.text}</Step>
            ))}
          </ul>
          
          <h3 className="text-sm font-medium text-neutral-400 mb-2">
            Industry / Client Type
          </h3>
          <ul className="list-none flex gap-4 flex-wrap">
            {product.plans && product.plans.map((plan, index) => (
              <li
                key={index}
                className="bg-neutral-800 text-sm text-white px-3 py-1 rounded-full font-medium"
              >
                {plan.name}
              </li>
            ))}
          </ul>

          <h3 className="text-sm font-medium text-neutral-400 mb-2 mt-8">
            Categories
          </h3>
          <ul className="flex gap-4 flex-wrap">
            {product.categories && product.categories?.map((category, idx) => (
              <li
                key={`category-${idx}`}
                className="bg-neutral-800 text-sm text-white px-3 py-1 rounded-full font-medium"
              >
                {category.name}
              </li>
            ))}
          </ul>
          
          {/* RESTORED: Button size matches "Add to Cart" (w-full, mt-10) */}
          <div className="mt-10 w-full">
            <Link 
              href="/contact" 
              className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
            >
              Request a Similar Project
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

const Divider = () => {
  return (
    <div className="relative">
      <div className="w-full h-px bg-neutral-950" />
      <div className="w-full h-px bg-neutral-800" />
    </div>
  );
};

const Step = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-start justify-start gap-2 my-4">
      <div className="h-4 w-4 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5">
        <IconCheck className="h-3 w-3 [stroke-width:4px] text-neutral-300" />
      </div>
      <div className="font-medium text-white text-sm">{children}</div>
    </div>
  );
};