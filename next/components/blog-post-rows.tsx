"use client";
import { truncate } from "@/lib/utils";
import { format } from "date-fns";
import { Link } from "next-view-transitions";
import React, { useEffect, useState } from "react";
import FuzzySearch from "fuzzy-search";
import { Article } from "@/types/types";
import { IconSearch } from "@tabler/icons-react"; 

export const BlogPostRows = ({ articles }: { articles: Article[] }) => {
  const [search, setSearch] = useState("");

  const searcher = new FuzzySearch(articles, ["title"], {
    caseSensitive: false,
  });

  const [results, setResults] = useState(articles);
  useEffect(() => {
    const results = searcher.search(search);
    setResults(results);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="w-full py-20">
      <div className="flex sm:flex-row flex-col justify-between gap-6 items-end sm:items-center mb-12 border-b border-white/10 pb-8">
        <h3 className="text-3xl font-bold font-primary text-white">More Posts</h3>
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-4 pr-10 py-3 text-sm rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
          />
          {/* Optional: Search Icon position */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
             <IconSearch className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {results.length === 0 ? (
          <div className="py-12 text-center bg-neutral-900/50 rounded-xl border border-dashed border-white/10">
            <p className="text-neutral-400">No articles found matching &quot;{search}&quot;</p>
          </div>
        ) : (
          results.map((article, index) => (
            <BlogPostRow article={article} key={article.slug + index} />
          ))
        )}
      </div>
    </div>
  );
};

export const BlogPostRow = ({ article }: { article: Article }) => {
  return (
    <Link
      href={`blog/${article.slug}`}
      key={`${article.slug}`}
      className="group flex md:flex-row flex-col items-start justify-between md:items-center py-6 hover:bg-white/5 px-4 rounded-xl -mx-4 transition-colors duration-200"
    >
      <div className="flex-1 pr-4">
        {/* Title */}
        <h4 className="text-lg md:text-xl font-bold font-primary text-white group-hover:text-cyan-400 transition-colors duration-200">
          {article.title}
        </h4>
        
        {/* Description */}
        <p className="text-neutral-400 text-sm mt-2 max-w-2xl font-secondary leading-relaxed">
          {truncate(article.description, 100)}
        </p>

        {/* Metadata Row */}
        <div className="flex flex-wrap gap-4 items-center mt-4">
          {/* Date */}
          <time className="text-neutral-500 text-xs font-medium uppercase tracking-wider flex items-center">
             {format(new Date(article.publishedAt), "MMMM dd, yyyy")}
          </time>
          
          <div className="h-1 w-1 rounded-full bg-cyan-500"></div>
          
          {/* Categories */}
          <div className="flex gap-2">
            {article.categories?.map((category, idx) => (
              <span
                key={`category-${idx}`}
                className="text-[10px] font-bold text-cyan-400 bg-cyan-950/30 border border-cyan-500/20 px-2 py-1 rounded-full uppercase tracking-wide group-hover:border-cyan-500/40 transition-colors"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Arrow Icon on the right */}
      <div className="hidden md:block opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-cyan-400">
         <IconArrowRight className="w-5 h-5" />
      </div>
    </Link>
  );
};

// Simple Arrow Icon Component
const IconArrowRight = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);