"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import FuzzySearch from "fuzzy-search";
import { IconSearch } from "@tabler/icons-react";
import { Article } from "@/types/types";
import { ArticleCard } from "./article-card";

export function AllPosts({
  articles,
  locale,
}: {
  articles: Article[];
  locale: string;
}) {
  const [search, setSearch] = useState("");

  const searcher = new FuzzySearch(articles, ["title"], {
    caseSensitive: false,
  });

  const [results, setResults] = useState(articles);
  useEffect(() => {
    setResults(searcher.search(search));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-20 w-full py-20"
    >
      <div className="flex sm:flex-row flex-col justify-between gap-6 items-end sm:items-center mb-10 border-b border-border pb-8">
        <div>
          <h2 className="text-3xl font-bold font-primary text-primary">
            All Posts
          </h2>
          <p className="mt-2 font-secondary text-neutral-600">
            Clinical knowledge and health education from the OnlineDoc team.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            aria-label="Search articles"
            className="w-full pl-4 pr-10 py-3 text-sm rounded-xl bg-white border border-border text-primary placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
            <IconSearch className="w-4 h-4" />
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-border">
          <p className="font-secondary text-neutral-600">
            No articles found matching &quot;{search}&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {results.map((article) => (
            <ArticleCard
              key={article.slug}
              article={article}
              locale={locale}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}
