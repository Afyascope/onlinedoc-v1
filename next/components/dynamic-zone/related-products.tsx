import { Container } from "../container";
import { Button } from "../elements/button";
import { Link } from "next-view-transitions";
import { ProductCard } from "@/components/products/product-card";

interface RelatedProductCTA {
  id?: number;
  text: string;
  URL: string;
  target?: string | null;
  variant?: "simple" | "outline" | "primary" | "muted";
}

export const RelatedProducts = ({
  heading,
  sub_heading,
  products,
  CTA,
  locale,
}: {
  heading: string;
  sub_heading: string;
  products: any[];
  CTA?: RelatedProductCTA | null;
  locale: string;
}) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="relative bg-neutral-50">
      <Container className="py-20 md:py-24">
        <div className="max-w-2xl">
          <h2 className="font-primary font-bold text-primary text-left tracking-tight text-3xl md:text-4xl leading-tight">
            {heading}
          </h2>
          <p className="mt-4 text-base md:text-lg text-neutral-700 leading-relaxed">
            {sub_heading}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>

        {CTA && CTA.text && CTA.URL && (
          <div className="mt-10 text-center">
            <Button
              as={Link}
              href={CTA.URL.startsWith("/") ? `/${locale}${CTA.URL}` : CTA.URL}
              target={CTA.target || undefined}
              variant={CTA.variant || "outline"}
            >
              {CTA.text}
            </Button>
          </div>
        )}
      </Container>
    </section>
  );
};
