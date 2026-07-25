import { IconArrowLeft } from "@tabler/icons-react";
import { Container } from "./container";
import Image from "next/image";
import { Link } from "next-view-transitions";
import { format } from "date-fns";
import { strapiImage } from "@/lib/strapi/strapiImage";
import DynamicZoneManager from "./dynamic-zone/manager";
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
          href="/blog" 
          className="group flex space-x-2 items-center text-neutral-400 hover:text-cyan-400 transition-colors"
        >
          <IconArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Articles</span>
        </Link>
      </div>

      {/* Main Banner Image */}
      <div className="w-full mx-auto mb-10">
        {article.image ? (
          <div className="relative w-full aspect-video md:h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 shadow-2xl">
            <Image
              src={strapiImage(article.image.url)}
              fill
              className="object-cover"
              alt={article.title}
              priority
            />
            {/* Subtle Gradient Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent" />
          </div>
        ) : (
          <div className="h-64 md:h-96 w-full rounded-2xl border border-white/10 bg-neutral-900 flex items-center justify-center">
             <span className="text-neutral-700">No Cover Image</span>
          </div>
        )}
      </div>

      <div className="xl:relative">
        <div className="mx-auto max-w-3xl">
          <article className="pb-8">
            
            {/* Categories */}
            <div className="flex gap-3 flex-wrap mb-6">
              {article.categories?.map((category, idx) => (
                <span
                  key={`category-${idx}`}
                  className="text-xs font-bold text-cyan-400 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-500/20 uppercase tracking-wide"
                >
                  {category.name}
                </span>
              ))}
            </div>

            {/* Title */}
            <header className="flex flex-col mb-8">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white font-primary leading-tight">
                {article.title}
              </h1>
            </header>

            {/* Content (Prose) */}
            <div className="prose prose-lg prose-invert prose-headings:font-primary prose-a:text-cyan-400 prose-img:rounded-xl">
              {children}
            </div>

            {/* Footer / Meta Data */}
            <div className="flex space-x-4 items-center pt-8 border-t border-white/10 mt-12">
              <time
                dateTime={article.publishedAt}
                className="flex items-center text-sm text-neutral-400"
              >
                Published on {format(new Date(article.publishedAt), "MMMM dd, yyyy")}
              </time>
              
              {/* Optional: Divider if you add author later */}
              {/* <div className="h-4 w-px bg-neutral-700" /> */}

              {/* Author Section (Ready for use) */}
              {/* <div className="flex space-x-2 items-center">
                <Image
                  src={article.authorAvatar || "/placeholder-avatar.jpg"}
                  alt={article.author}
                  width={24}
                  height={24}
                  className="rounded-full bg-neutral-800"
                />
                <p className="text-sm font-medium text-neutral-300">
                  {article.author}
                </p> 
              </div> */}
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