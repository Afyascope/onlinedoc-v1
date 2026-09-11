import { Product } from "@/types/types";
import { ProductCard } from "@/components/products/product-card";

export const Featured = ({ products, locale }: { products: Product[]; locale: string }) => {
  if (!products || products.length === 0) return null;

  const [lead, ...rest] = products;

  return (
    <section id="featured" className="py-16 md:py-20">
      <header className="mb-10 md:mb-12">
        <h2 className="text-3xl font-bold text-primary font-primary md:text-5xl">
          Featured Innovations
        </h2>
        <p className="mt-3 max-w-2xl font-secondary text-lg text-neutral-500">
          Featured products from the OnlineDoc ecosystem.
        </p>
      </header>

      <div className="grid gap-6">
        <ProductCard product={lead} locale={locale} variant="featured" lead />
        {rest.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {rest.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} variant="featured" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
