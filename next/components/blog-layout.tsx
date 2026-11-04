import { IconArrowLeft } from "@tabler/icons-react";
import { Container } from "./container";
import { Link } from "next-view-transitions";
import { format } from "date-fns";
import DynamicZoneManager from "./dynamic-zone/manager";
import { ArticleMedia } from "./blog/article-media";
import { CategoryBadge } from "./blog/article-card";
import { Breadcrumbs, type Crumb } from "./seo/breadcrumbs";
import { Article } from "@/types/types";

export async function BlogLayout({
  article,
  locale,
  breadcrumbs,
  children,
}: {
  article: Article;
  locale: string;
  breadcrumbs?: Crumb[];
  children: React.ReactNode;
}) {

  return (
    <main>
    <Container className="mt-20 lg:mt-32 mb-20">

      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}

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
            <div className="mt-12 border-t border-border pt-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600">
                <time dateTime={article.publishedAt}>
                  {locale === "sw" ? "Imechapishwa" : "Published"}{" "}
                  {format(new Date(article.publishedAt), "MMMM dd, yyyy")}
                </time>
                {article.updatedAt && article.updatedAt !== article.publishedAt ? (
                  <time dateTime={article.updatedAt}>
                    {locale === "sw" ? "Imesasishwa" : "Last updated"}{" "}
                    {format(new Date(article.updatedAt), "MMMM dd, yyyy")}
                  </time>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {locale === "sw" ? "Imechapishwa na " : "Published by "}
                <Link
                  href={`/${locale}`}
                  className="font-medium text-brand hover:underline"
                >
                  OnlineDoc Healthcare
                </Link>
              </p>
              <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                {locale === "sw"
                  ? "Taarifa hizi ni kwa elimu ya jumla na hazichukui nafasi ya ushauri wa mtaalamu wa afya."
                  : "This information is for general education and does not replace advice from a qualified health professional."}{" "}
                <Link
                  href={`/${locale}/terms-of-service#medical-disclaimer`}
                  className="font-medium text-brand hover:underline"
                >
                  {locale === "sw" ? "Kanusho la matibabu" : "Medical disclaimer"}
                </Link>
              </p>
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
    </main>
  );
}
