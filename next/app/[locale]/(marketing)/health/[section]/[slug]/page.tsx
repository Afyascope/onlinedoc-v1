import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { Container } from "@/components/container";
import { ArticleMedia } from "@/components/blog/article-media";
import DynamicZoneManager from "@/components/dynamic-zone/manager";
import { ContentSections, RelatedContent } from "@/components/health/health-section";
import ClientSlugHandler from "../../../ClientSlugHandler";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { contentTitle, healthLabel, healthSections, sectionTitle, type HealthItem, type HealthSection, contentMetadata } from "@/lib/health/content";

function sectionFromParam(value: string): HealthSection | undefined {
  return (Object.keys(healthSections) as HealthSection[]).find(key => healthSections[key].route === value);
}

export async function generateMetadata({ params }: { params: { locale: string; section: string; slug: string } }): Promise<Metadata> {
  const section = sectionFromParam(params.section);
  if (!section) return {};
  const item = await fetchContentType(healthSections[section].api, { filters: { slug: params.slug, locale: params.locale }, populate: { seo: { populate: ["metaImage", "twitterImage"] } } }, true) as HealthItem | null;
  return contentMetadata(item?.seo, params.locale);
}

const fieldMap: Record<HealthSection, string[]> = {
  conditions: ["overview", "causes", "symptoms", "riskFactors", "diagnosis", "investigations", "treatmentAndManagement", "prevention", "whenToSeekCare"],
  medicines: ["uses", "generalUse", "commonSideEffects", "precautions", "contraindications"],
  tests: ["whatItIs", "whyRequested", "preparation", "generalInterpretation"],
  guides: ["instructions"], nutrition: ["content"], articles: ["content"],
};

export default async function HealthDetail({ params }: { params: { locale: string; section: string; slug: string } }) {
  const section = sectionFromParam(params.section);
  if (!section) notFound();
  const item = await fetchContentType(healthSections[section].api, { filters: { slug: params.slug, locale: params.locale } }, true) as HealthItem | null;
  if (!item) notFound();
  const localizedSlugs = item.localizations?.reduce(
    (acc: Record<string, string>, localization) => {
      acc[localization.locale] = localization.slug;
      return acc;
    },
    { [params.locale]: params.slug }
  ) || { [params.locale]: params.slug };
  const title = contentTitle(section, item);
  const description = item.description || item.shortDescription;
  const related = section === "conditions"
    ? [{ title: healthLabel(params.locale, "relatedTreatments"), items: item.treatments, section: "medicines" as const }, { title: healthLabel(params.locale, "relatedTests"), items: item.medicalTests, section: "tests" as const }, { title: healthLabel(params.locale, "relatedNutrition"), items: item.nutritionGuides, section: "nutrition" as const }, { title: healthLabel(params.locale, "relatedGuides"), items: item.healthGuides, section: "guides" as const }, { title: healthLabel(params.locale, "relatedArticles"), items: item.articles, section: "articles" as const }]
    : section === "articles"
      ? [{ title: healthLabel(params.locale, "relatedConditions"), items: item.conditions, section: "conditions" as const }, { title: healthLabel(params.locale, "relatedTreatments"), items: item.treatments, section: "medicines" as const }, { title: healthLabel(params.locale, "relatedTests"), items: item.medicalTests, section: "tests" as const }, { title: healthLabel(params.locale, "relatedGuides"), items: item.healthGuides, section: "guides" as const }, { title: healthLabel(params.locale, "relatedNutrition"), items: item.nutritionGuides, section: "nutrition" as const }]
      : [{ title: healthLabel(params.locale, "relatedConditions"), items: item.conditions, section: "conditions" as const }, { title: healthLabel(params.locale, "relatedArticles"), items: item.articles, section: "articles" as const }];

  return <main className="py-8 md:py-12"><ClientSlugHandler localizedSlugs={localizedSlugs} /><Container>
    <Link href={`/${params.locale}/health/${params.section}`} className="inline-flex rounded-sm py-3 text-sm font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">← {healthLabel(params.locale, "back")} · {sectionTitle(section, params.locale)}</Link>
    <article className="mx-auto mt-4 max-w-3xl">
      {(section === "nutrition" || section === "articles") && item.image ? <ArticleMedia media={item.image} alt={item.image.alternativeText || title} className="mb-8 aspect-video rounded-2xl" sizes="(max-width: 768px) 100vw, 768px" /> : null}
      <header className="mb-8">
        {section === "articles" && item.articleType ? <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand">{item.articleType.replaceAll("-", " ")}</p> : null}
        <h1 className="font-primary text-3xl font-bold leading-tight text-primary md:text-5xl">{title}</h1>
        {description && <p className="mt-4 text-lg leading-relaxed text-neutral-600">{description}</p>}
        {section === "medicines" && item.genericName ? <p className="mt-3 text-sm text-neutral-600"><span className="font-semibold">{healthLabel(params.locale, "genericName")}:</span> {item.genericName}</p> : null}
        {section === "articles" && item.categories?.length ? <ul className="mt-5 flex flex-wrap gap-2" aria-label={healthLabel(params.locale, "categories")}>{item.categories.map((cat, i) => <li key={`${cat.name}-${i}`} className="rounded-full bg-info-bg px-3 py-1 text-xs font-semibold text-primary">{cat.name}</li>)}</ul> : null}
      </header>
      <ContentSections item={item} locale={params.locale} fields={fieldMap[section]} />
      {section === "medicines" ? <p className="mt-9 rounded-xl bg-info-bg px-5 py-4 text-sm leading-relaxed text-primary">{healthLabel(params.locale, "disclaimer")}</p> : null}
      {section === "tests" && item.generalInterpretation?.length ? <p className="mt-6 text-sm text-neutral-600">{params.locale === "sw" ? "Matokeo ya kipimo pekee hayawezi kuthibitisha utambuzi." : "A test result on its own cannot establish a diagnosis."}</p> : null}
    </article>
    <div className="mx-auto max-w-5xl">
      {related.map(group => <RelatedContent key={group.title} title={group.title} items={group.items} section={group.section} locale={params.locale} />)}
      {section === "articles" && item.dynamic_zone?.length ? <div className="mt-10"><DynamicZoneManager dynamicZone={item.dynamic_zone as never} locale={params.locale} /></div> : null}
    </div>
  </Container></main>;
}
