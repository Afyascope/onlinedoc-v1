import { Link } from "next-view-transitions";
import { IconArrowRight, IconShoppingCart, IconStethoscope } from "@tabler/icons-react";
import { Button } from "@/components/elements/button";
import { PriceTag } from "@/components/marketplace/PriceTag";
import { ProductMedia } from "@/components/products/product-media";
import type { ProductCardProduct } from "@/components/products/product-card";

interface ProductsHeroProps {
  heading: string;
  subHeading: string;
  products: ProductCardProduct[];
  locale: string;
}

export function ProductsHero({ heading, subHeading, products, locale }: ProductsHeroProps) {
  const list = products ?? [];
  const showcase = list.find((p) => p.featured) ?? list[0] ?? null;

  return (
    <section className="relative grid items-center gap-10 pb-16 md:pb-24 lg:grid-cols-2 lg:gap-16">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-info-bg px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
          <IconStethoscope size={14} aria-hidden="true" />
          OnlineDoc Healthcare
        </span>

        <h1 className="mt-6 font-primary text-4xl font-bold leading-tight tracking-tight text-primary md:text-5xl lg:text-6xl">
          {heading}
        </h1>

        <p className="mt-6 max-w-xl font-secondary text-base leading-relaxed text-neutral-600 md:text-lg">
          {subHeading}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button as="a" href="#marketplace" variant="primary" className="gap-2">
            Explore Products
            <IconArrowRight size={16} aria-hidden="true" />
          </Button>
          <Button as="a" href="#featured" variant="outline">
            Learn More
          </Button>
        </div>
      </div>

      <HeroShowcase product={showcase} locale={locale} />
    </section>
  );
}

function HeroShowcase({
  product,
  locale,
}: {
  product: ProductCardProduct | null;
  locale: string;
}) {
  if (!product) {
    return (
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
        <div className="text-center text-neutral-400">
          <IconShoppingCart size={48} className="mx-auto" aria-hidden="true" />
          <p className="mt-3 font-secondary text-sm">Digital health products coming soon</p>
        </div>
      </div>
    );
  }

  const media = product.images?.find((x) => x && x.url) ?? null;
  const category = product.categories?.find((c) => c && c.name)?.name ?? null;
  const href = product.slug ? `/${locale}/products/${product.slug}` : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="relative">
        <ProductMedia
          media={media}
          alt={media?.alternativeText || product.name}
          aspectClassName="aspect-[4/3]"
          iconSize={48}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {category && (
          <span className="absolute left-4 top-4 rounded-full border border-brand/20 bg-white/90 px-3 py-1 text-xs font-bold text-primary backdrop-blur">
            {category}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="font-secondary text-xs text-neutral-500">Featured product</p>
          <h3 className="mt-1 truncate font-primary text-base font-bold text-primary">{product.name}</h3>
        </div>
        <PriceTag price={product.price ?? 0} className="whitespace-nowrap text-lg font-bold text-brand" />
      </div>

      {href && (
        <Link href={href} className="absolute inset-0 z-10" aria-label={`View ${product.name}`} />
      )}
    </div>
  );
}
