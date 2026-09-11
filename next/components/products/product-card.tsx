"use client";

import { Link } from "next-view-transitions";
import { cn } from "@/lib/utils";
import { BuyButton } from "@/components/marketplace/BuyButton";
import { PriceTag } from "@/components/marketplace/PriceTag";
import { ProductMedia } from "@/components/products/product-media";

export interface ProductCardProduct {
  id: number | string;
  slug?: string | null;
  name: string;
  description?: string | null;
  price?: number | string;
  images?: Array<{ url?: string | null; alternativeText?: string | null; mime?: string | null; ext?: string | null } | null> | null;
  categories?: Array<{ name?: string } | null> | null;
  file?: { url?: string | null } | null;
  featured?: boolean | null;
}

type ProductCardVariant = "default" | "featured" | "compact";

interface ProductCardProps {
  product: ProductCardProduct;
  locale: string;
  variant?: ProductCardVariant;
  lead?: boolean;
  className?: string;
}

function firstCategory(product: ProductCardProduct): string | null {
  const category = product.categories?.find((c) => c && c.name);
  return category?.name ?? null;
}

function detailHref(product: ProductCardProduct, locale: string): string | null {
  if (!product.slug) return null;
  return `/${locale}/products/${product.slug}`;
}

export function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center self-start rounded-full border border-brand bg-info-bg px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
      {label}
    </span>
  );
}

function TitleLink({
  href,
  className,
  children,
}: {
  href: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  if (!href) return <h3 className={className}>{children}</h3>;

  return (
    <Link href={href}>
      <h3 className={className}>{children}</h3>
    </Link>
  );
}

export function ProductCard({
  product,
  locale,
  variant = "default",
  lead = false,
  className,
}: ProductCardProps) {
  const href = detailHref(product, locale);
  const category = firstCategory(product);
  const hasFile = Boolean(product.file?.url ?? product.file);

  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";

  const media = product.images?.find((x) => x && x.url) ?? null;
  const alt = media?.alternativeText || product.name;

  if (isFeatured && lead) {
    return (
      <div
        className={cn(
          "group grid overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-200 hover:border-brand/20 hover:shadow-lg md:grid-cols-2",
          className
        )}
      >
        {href ? (
          <Link href={href} className="block">
            <ProductMedia
              media={media}
              alt={alt}
              aspectClassName="aspect-[4/3] md:aspect-auto md:h-full md:min-h-[360px]"
              iconSize={48}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </Link>
        ) : (
          <ProductMedia
            media={media}
            alt={alt}
            aspectClassName="aspect-[4/3] md:aspect-auto md:h-full md:min-h-[360px]"
            iconSize={48}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
        <div className="flex flex-col justify-center p-6 md:p-8">
          {category && <CategoryBadge label={category} />}
          <TitleLink href={href} className="mt-3 font-primary text-xl font-bold text-primary transition-colors group-hover:text-brand md:text-2xl">
            {product.name}
          </TitleLink>
          {product.description && (
            <p className="mt-3 line-clamp-3 font-secondary text-sm leading-relaxed text-neutral-600 md:text-base">
              {product.description}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <PriceTag price={product.price ?? 0} className="text-xl font-bold text-brand" />
            <BuyButton productSlug={product.slug ?? ""} price={product.price ?? 0} hasFile={hasFile} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-200 hover:border-brand/20 hover:shadow-lg",
        className
      )}
    >
      {href ? (
        <Link href={href} className="block">
          <ProductMedia
            media={media}
            alt={alt}
            aspectClassName="aspect-[4/3]"
            iconSize={32}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </Link>
      ) : (
        <ProductMedia
          media={media}
          alt={alt}
          aspectClassName="aspect-[4/3]"
          iconSize={32}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      )}
      <div className="flex flex-1 flex-col p-4 md:p-5">
        {category && <CategoryBadge label={category} />}
        <TitleLink
          href={href}
          className={cn(
            "font-primary font-semibold text-primary transition-colors group-hover:text-brand",
            isFeatured
              ? "mt-3 text-lg"
              : isCompact
                ? "mt-2 line-clamp-2 text-sm"
                : "mt-2 line-clamp-2 text-base"
          )}
        >
          {product.name}
        </TitleLink>
        {!isCompact && product.description && (
          <p
            className={cn(
              "mt-1 flex-1 font-secondary text-neutral-500",
              isFeatured ? "line-clamp-2 text-sm" : "line-clamp-2 text-xs"
            )}
          >
            {product.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <PriceTag
            price={product.price ?? 0}
            className={cn("font-bold text-brand", isFeatured ? "text-base" : "text-sm")}
          />
          <BuyButton
            productSlug={product.slug ?? ""}
            price={product.price ?? 0}
            hasFile={hasFile}
            className={isFeatured ? "px-4 py-2 text-xs" : "px-3 py-1.5 text-xs"}
          />
        </div>
      </div>
    </div>
  );
}
