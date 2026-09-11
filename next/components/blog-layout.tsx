import { IconArrowLeft } from "@tabler/icons-react";
import { Container } from "./container";
import { Link } from "next-view-transitions";
import { format } from "date-fns";
import DynamicZoneManager from "./dynamic-zone/manager";
import { ArticleMedia } from "./blog/article-media";
import { CategoryBadge } from "./blog/article-card";
import { Article } from "@/types/types";

export async function BlogLayout({
  article,
  locale,
  children,
}: {
  article: Article;
  locale: string;
  children: React.ReactNode;
}) {

  return (
    <Container className="mt-20 lg:mt-32 mb-20">

      {/* Navigation */}
      <div className="flex justify-between items-center py-8">
        <Link
          href={`/${locale}/blog`}
          className="group flex space-x-2 items-center text-neutral-600 hover:text-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
        >
          <IconArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Articles</span>
        </Link>
      </div>

      {/* Main Banner Image */}
      <div className="w-full mx-auto mb-10">
        <ArticleMedia
          media={article.image}
          alt={article.title}
          priority
          className="w-full aspect-video md:h-[500px] rounded-2xl border border-border bg-white shadow-sm"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        />
      </div>

      <div className="xl:relative">
        <div className="mx-auto max-w-[720px]">
          <article className="pb-8">

            {/* Categories */}
            {article.categories?.length > 0 && (
              <div className="flex gap-3 flex-wrap mb-6">
                {article.categories?.map((category, idx) => (
                  <CategoryBadge key={`category-${idx}`} name={category.name} />
                ))}
              </div>
            )}

            {/* Title */}
            <header className="flex flex-col mb-8">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary font-primary leading-tight">
                {article.title}
              </h1>
            </header>

            {/* Content (Prose) */}
            <div className="prose prose-lg prose-headings:font-primary prose-a:text-brand prose-img:rounded-xl max-w-none">
              {children}
            </div>

            {/* Footer / Meta Data */}
            <div className="flex space-x-4 items-center pt-8 border-t border-border mt-12">
              <time
                dateTime={article.publishedAt}
                className="flex items-center text-sm text-neutral-600"
              >
                Published on {format(new Date(article.publishedAt), "MMMM dd, yyyy")}
              </time>
            </div>

          </article>
        </div>
      </div>

      {/* Dynamic Zone Components */}
      {article?.dynamic_zone && (
        <div className="mt-12">
          <DynamicZoneManager dynamicZone={article?.dynamic_zone} locale={locale} />
        </div>
      )}
    </Container>
  );
}
