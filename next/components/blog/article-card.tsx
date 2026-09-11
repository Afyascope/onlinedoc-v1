import { Link } from "next-view-transitions";
import { format } from "date-fns";
import Balancer from "react-wrap-balancer";
import { IconArrowRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { truncate } from "@/lib/utils";
import { Article } from "@/types/types";
import { ArticleMedia } from "./article-media";

type ArticleCardVariant = "default" | "featured" | "compact";

interface ArticleCardProps {
  article: Article;
  locale: string;
  variant?: ArticleCardVariant;
  className?: string;
}

function articleHref(article: Article, locale: string): string {
  return `/${locale}/blog/${article.slug}`;
}

export function CategoryBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center self-start rounded-full border border-brand bg-info-bg px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
      {name}
    </span>
  );
}

function ReadArticle() {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
      Read article
      <IconArrowRight
        size={16}
        aria-hidden="true"
        className="transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </span>
  );
}

export function ArticleCard({
  article,
  locale,
  variant = "default",
  className,
}: ArticleCardProps) {
  const href = articleHref(article, locale);
  const categories = article.categories ?? [];
  const alt = article.image?.alternativeText || article.title;

  if (variant === "featured") {
    return (
      <Link
        href={href}
        className={cn(
          "group grid overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:border-brand/30 hover:shadow-lg md:grid-cols-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          className
        )}
      >
        <ArticleMedia
          media={article.image}
          alt={alt}
          className="aspect-video md:aspect-auto md:h-full md:min-h-[360px]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        <div className="flex flex-col justify-center p-6 md:p-8">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category, idx) => (
                <CategoryBadge key={`category-${idx}`} name={category.name} />
              ))}
            </div>
          )}

          <h2 className="mt-3 font-primary text-xl font-bold leading-tight text-primary transition-colors group-hover:text-brand md:text-3xl">
            <Balancer>{article.title}</Balancer>
          </h2>

          {article.description && (
            <p className="mt-3 line-clamp-3 font-secondary text-sm leading-relaxed text-neutral-600 md:text-base">
              {truncate(article.description, 200)}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/60 pt-5">
            <time
              dateTime={article.publishedAt}
              className="font-secondary text-sm text-neutral-600"
            >
              {format(new Date(article.publishedAt), "MMMM dd, yyyy")}
            </time>
            <ReadArticle />
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:border-brand/30 hover:shadow-lg",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          className
        )}
      >
        <ArticleMedia
          media={article.image}
          alt={alt}
          className="aspect-video"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        <div className="flex flex-1 flex-col p-4 md:p-5">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category, idx) => (
                <CategoryBadge key={`category-${idx}`} name={category.name} />
              ))}
            </div>
          )}

          <h3 className="mt-2 line-clamp-2 font-primary text-base font-semibold leading-snug text-primary transition-colors group-hover:text-brand">
            {article.title}
          </h3>

          <div className="mt-auto flex items-center justify-between pt-4">
            <time
              dateTime={article.publishedAt}
              className="font-secondary text-xs text-neutral-500"
            >
              {format(new Date(article.publishedAt), "MMM dd, yyyy")}
            </time>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
              Read
              <IconArrowRight size={14} aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:border-brand/30 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        className
      )}
    >
      <ArticleMedia
        media={article.image}
        alt={alt}
        className="aspect-video"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      <div className="flex flex-1 flex-col p-5">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category, idx) => (
              <CategoryBadge key={`category-${idx}`} name={category.name} />
            ))}
          </div>
        )}

        <h3 className="mt-3 font-primary text-lg font-semibold leading-snug text-primary transition-colors group-hover:text-brand">
          <Balancer>{article.title}</Balancer>
        </h3>

        {article.description && (
          <p className="mt-2 line-clamp-2 font-secondary text-sm leading-relaxed text-neutral-600">
            {truncate(article.description, 150)}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4">
          <time
            dateTime={article.publishedAt}
            className="font-secondary text-xs text-neutral-500"
          >
            {format(new Date(article.publishedAt), "MMM dd, yyyy")}
          </time>
          <ReadArticle />
        </div>
      </div>
    </Link>
  );
}
