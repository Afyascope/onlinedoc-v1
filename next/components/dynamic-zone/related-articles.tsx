import { ArticleCard } from "@/components/blog/article-card";
import { Button } from "@/components/elements/button";
import { Container } from "../container";
import { Link } from "next-view-transitions";

interface RelatedArticlesCTA {
  text: string;
  URL: string;
  target?: string | null;
  variant?: "simple" | "outline" | "primary" | "muted";
}

export const RelatedArticles = ({
  heading,
  sub_heading,
  articles,
  CTA,
  locale,
}: {
  heading: string;
  sub_heading: string;
  articles: any[];
  CTA?: RelatedArticlesCTA | null;
  locale: string;
}) => {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="relative bg-neutral-50">
      <Container className="py-20 md:py-24">
        <div className="max-w-2xl">
          <h2 className="font-primary font-bold text-primary text-left tracking-tight text-3xl md:text-4xl leading-tight">
            {heading}
          </h2>
          {sub_heading && (
            <p className="mt-4 text-base md:text-lg text-neutral-700 leading-relaxed">
              {sub_heading}
            </p>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.slice(0, 3).map((article) => (
            <ArticleCard
              key={article.slug}
              article={article}
              locale={locale}
            />
          ))}
        </div>

        {CTA?.text && CTA.URL && (
          <div className="mt-10 text-center">
            <Button
              as={Link}
              href={
                CTA.URL.startsWith("/")
                  ? `/${locale}${CTA.URL}`
                  : CTA.URL
              }
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
