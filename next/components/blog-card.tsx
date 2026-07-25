import { Link } from "next-view-transitions";
import React from "react";
import { BlurImage } from "@/components/blur-image";
import Balancer from "react-wrap-balancer";
import { truncate } from "@/lib/utils";
import { format } from "date-fns";
import { strapiImage } from "@/lib/strapi/strapiImage";
import { Article } from "@/types/types";

export const BlogCard = ({ article, locale }: { article: Article, locale: string }) => {
  return (
    <Link
      className="group grid grid-cols-1 md:grid-cols-2 rounded-2xl border border-white/10 bg-neutral-900 overflow-hidden hover:scale-[1.01] transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-900/20 hover:border-cyan-500/30"
      href={`/${locale}/blog/${article.slug}`}
    >
      {/* Image Section */}
      <div className="relative h-64 md:h-full w-full overflow-hidden">
        {article.image ? (
          <BlurImage
            src={strapiImage(article.image.url)}
            alt={article.title}
            height="1200"
            width="1200"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-neutral-800">
            <span className="text-neutral-500 text-sm">No Image</span>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-neutral-900/50" />
      </div>

      {/* Content Section */}
      <div className="p-6 md:p-8 flex flex-col justify-between h-full">
        <div>
          {/* Categories */}
          <div className="flex gap-2 flex-wrap mb-6">
            {article.categories?.map((category, idx) => (
              <span
                key={`category-${idx}`}
                className="bg-cyan-950/30 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
              >
                {category.name}
              </span>
            ))}
          </div>

          {/* Title */}
          <h2 className="text-xl md:text-3xl font-bold mb-4 text-white font-primary group-hover:text-cyan-400 transition-colors">
            <Balancer>{article.title}</Balancer>
          </h2>

          {/* Description */}
          <p className="text-left text-sm md:text-base text-neutral-400 font-secondary leading-relaxed line-clamp-3">
            {truncate(article.description, 200)}
          </p>
        </div>

        {/* Footer / Date */}
        <div className="flex items-center mt-6 pt-6 border-t border-white/5">
          <div className="h-1.5 w-1.5 bg-cyan-500 rounded-full mr-3"></div>
          <time className="text-neutral-400 text-sm font-medium">
            {format(new Date(article.publishedAt), "MMMM dd, yyyy")}
          </time>
        </div>
      </div>
    </Link>
  );
};

export const BlogCardVertical = ({ article, locale }: { article: Article, locale: string }) => {
  return (
    <Link
      className="group flex flex-col h-full rounded-2xl border border-white/10 bg-neutral-900 overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-900/20 hover:border-cyan-500/30"
      href={`/${locale}/blog/${article.slug}`}
    >
      {/* Image Section */}
      <div className="relative h-64 w-full overflow-hidden">
        {article.image ? (
          <BlurImage
            src={strapiImage(article.image.url || "")}
            alt={article.title}
            height="800"
            width="800"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-neutral-800">
             <span className="text-neutral-500 text-sm">No Image</span>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-60" />
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-grow">
        
        {/* Categories */}
        <div className="flex gap-2 flex-wrap mb-4">
          {article.categories?.map((category, idx) => (
            <span
              key={`category-${idx}`}
              className="bg-cyan-950/30 text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
            >
              {category.name}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="text-lg md:text-xl font-bold mb-3 text-white font-primary leading-tight group-hover:text-cyan-400 transition-colors">
          <Balancer>{article.title}</Balancer>
        </h3>

        {/* Description */}
        <p className="text-sm text-neutral-400 font-secondary leading-relaxed line-clamp-3 mb-6">
          {truncate(article.description, 150)}
        </p>

        {/* Footer / Date (Pushed to bottom) */}
        <div className="mt-auto flex items-center pt-4 border-t border-white/5">
          <div className="h-1.5 w-1.5 bg-cyan-500 rounded-full mr-2"></div>
          <time className="text-neutral-500 text-xs font-medium uppercase tracking-wider">
            {format(new Date(article.publishedAt), "MMM dd, yyyy")}
          </time>
        </div>
      </div>
    </Link>
  );
};