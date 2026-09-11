"use client";

import { useState, useMemo } from "react";
import { IconSearch } from "@tabler/icons-react";
import { ProductCard } from "@/components/products/product-card";

interface StrapiProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  featured?: boolean;
  images: any[];
  file?: { url?: string } | null;
  categories?: { name: string }[];
}

export function MarketplaceCatalog({ products, locale }: { products: StrapiProduct[]; locale: string }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");

  const purchasable = products || [];

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    purchasable.forEach((p) => p.categories?.forEach((c) => cats.add(c.name)));
    return Array.from(cats).sort();
  }, [purchasable]);

  const filtered = useMemo(() => {
    let result = [...purchasable];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    if (category) {
      result = result.filter((p) =>
        p.categories?.some((c) => c.name === category)
      );
    }

    switch (sort) {
      case "price_asc": result.sort((a, b) => a.price - b.price); break;
      case "price_desc": result.sort((a, b) => b.price - a.price); break;
      default: result.sort((a, b) => b.id - a.id); break;
    }

    return result;
  }, [purchasable, search, category, sort]);

  if (purchasable.length === 0) return null;

  return (
    <div id="marketplace" className="py-16 md:py-20">
      <h2 className="text-3xl md:text-5xl font-bold font-primary text-primary mb-4">
        Digital Health Marketplace
      </h2>
      <p className="text-neutral-500 font-secondary text-lg max-w-2xl mb-8">
        Downloadable health products created by our clinicians.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm text-primary placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-primary"
        >
          <option value="">All Categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-primary"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-neutral-400">No products found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
