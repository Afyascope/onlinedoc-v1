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
import { contentDescription, contentTitle, healthLabel, healthSections, sectionTitle, type HealthItem, type HealthSection, contentMetadata } from "@/lib/health/content";
import { absoluteUrl, detailAlternates } from "@/lib/seo/alternates";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { BreadcrumbSchema, MedicalWebPageSchema } from "@/components/seo/json-ld";

function sectionFromParam(value: string): HealthSection | undefined {
  return (Object.keys(healthSections) as HealthSection[]).find(key => healthSections[key].route === value);
}

export async function generateMetadata({ params }: { params: { locale: string; section: string; slug: string } }): Promise<Metadata> {
  const section = sectionFromParam(params.section);
  if (!section) return {};
  const item = await fetchContentType(healthSections[section].api, {
    filters: { slug: params.slug, locale: params.locale },
    populate: {
      seo: { populate: ["metaImage"] },
      localizations: { fields: ["slug", "locale"] },
    },
  }, true) as HealthItem | null;
  if (!item) return { title: "Page Not Found", robots: { index: false } };
  // Articles are exposed at both /blog/{slug} (primary) and /health/articles/{slug}
  // (health library mirror). Canonicalize the mirror to the primary blog URL so
  // the two paths never compete as duplicate content.
  const buildPath = section === "articles"
    ? (locale: string, slug: string) => `/${locale}/blog/${slug}`
    : (locale: string, slug: string) => `/${locale}/health/${params.section}/${slug}`;
  return contentMetadata(item.seo, params.locale, detailAlternates(item.localizations, {
    locale: params.locale,
    slug: params.slug,
    buildPath,
  }), {
    publishedTime: item.publishedAt,
    modifiedTime: item.updatedAt,
    fallbackTitle: contentTitle(section, item),
    fallbackDescription: contentDescription(section, item),
  });
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
  const item = await fetchContentType(healthSections[section].api, { filters: { slug: params.slug, locale: params.locale } }, true, true) as HealthItem | null;
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
  const canonicalPath = section === "articles"
    ? `/${params.locale}/blog/${params.slug}`
    : `/${params.locale}/health/${params.section}/${params.slug}`;
  const pageUrl = absoluteUrl(canonicalPath);
  const updatedDate = item.updatedAt || item.publishedAt;
  const updatedAt = updatedDate && !Number.isNaN(new Date(updatedDate).getTime())
    ? new Date(updatedDate)
    : null;
  const updatedLabel = updatedAt
    ? updatedAt.toLocaleDateString(params.locale === "sw" ? "sw-KE" : "en-KE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const sectionHref = section === "articles"
    ? absoluteUrl(`/${params.locale}/blog`)
    : absoluteUrl(`/${params.locale}/health/${params.section}`);
  const sectionCrumb = section === "articles"
    ? (params.locale === "sw" ? "Makala" : "Blog")
    : sectionTitle(section, params.locale);
  const breadcrumbs = section === "articles"
    ? [
        {
          name: params.locale === "sw" ? "Nyumbani" : "Home",
          href: absoluteUrl(`/${params.locale}`),
        },
        { name: sectionCrumb, href: sectionHref },
        { name: title, href: pageUrl },
      ]
    : [
        {
          name: params.locale === "sw" ? "Nyumbani" : "Home",
          href: absoluteUrl(`/${params.locale}`),
        },
        {
          name: params.locale === "sw" ? "Afya" : "Health",
          href: absoluteUrl(`/${params.locale}/health`),
        },
        { name: sectionCrumb, href: sectionHref },
        { name: title, href: pageUrl },
      ];
  const aboutType = section === "conditions"
    ? "MedicalCondition"
    : section === "medicines"
      ? "Drug"
      : section === "tests"
        ? "MedicalTest"
        : undefined;
  const related = section === "conditions"
    ? [{ title: healthLabel(params.locale, "relatedTreatments"), items: item.treatments, section: "medicines" as const }, { title: healthLabel(params.locale, "relatedTests"), items: item.medicalTests, section: "tests" as const }, { title: healthLabel(params.locale, "relatedNutrition"), items: item.nutritionGuides, section: "nutrition" as const }, { title: healthLabel(params.locale, "relatedGuides"), items: item.healthGuides, section: "guides" as const }, { title: healthLabel(params.locale, "relatedArticles"), items: item.articles, section: "articles" as const }]
    : section === "articles"
      ? [{ title: healthLabel(params.locale, "relatedConditions"), items: item.conditions, section: "conditions" as const }, { title: healthLabel(params.locale, "relatedTreatments"), items: item.treatments, section: "medicines" as const }, { title: healthLabel(params.locale, "relatedTests"), items: item.medicalTests, section: "tests" as const }, { title: healthLabel(params.locale, "relatedGuides"), items: item.healthGuides, section: "guides" as const }, { title: healthLabel(params.locale, "relatedNutrition"), items: item.nutritionGuides, section: "nutrition" as const }]
      : [{ title: healthLabel(params.locale, "relatedConditions"), items: item.conditions, section: "conditions" as const }, { title: healthLabel(params.locale, "relatedArticles"), items: item.articles, section: "articles" as const }];

  return <main className="py-8 md:py-12">
    <ClientSlugHandler localizedSlugs={localizedSlugs} />
    <BreadcrumbSchema items={breadcrumbs} />
    <MedicalWebPageSchema
      title={title}
      description={description}
      url={pageUrl}
      inLanguage={params.locale === "sw" ? "sw" : "en"}
      datePublished={item.publishedAt}
      dateModified={item.updatedAt}
      aboutType={aboutType}
      section={sectionTitle(section, params.locale)}
    />
    <Container>
    <Breadcrumbs items={breadcrumbs} className="py-3" />
    <article className="mx-auto mt-4 max-w-3xl">
      {(section === "nutrition" || section === "articles") && item.image ? <ArticleMedia media={item.image} alt={item.image.alternativeText || title} className="mb-8 aspect-video rounded-2xl" sizes="(max-width: 768px) 100vw, 768px" /> : null}
      <header className="mb-8">
        {section === "articles" && item.articleType ? <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand">{item.articleType.replaceAll("-", " ")}</p> : null}
        <h1 className="font-primary text-3xl font-bold leading-tight text-primary md:text-5xl">{title}</h1>
        {description && <p className="mt-4 text-lg leading-relaxed text-neutral-600">{description}</p>}
        {section === "medicines" && item.genericName ? <p className="mt-3 text-sm text-neutral-600"><span className="font-semibold">{healthLabel(params.locale, "genericName")}:</span> {item.genericName}</p> : null}
        {section === "articles" && item.categories?.length ? <ul className="mt-5 flex flex-wrap gap-2" aria-label={healthLabel(params.locale, "categories")}>{item.categories.map((cat, i) => <li key={`${cat.name}-${i}`} className="rounded-full bg-info-bg px-3 py-1 text-xs font-semibold text-primary">{cat.name}</li>)}</ul> : null}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          <span>
            {params.locale === "sw" ? "Imechapishwa na " : "Published by "}
            <Link href={`/${params.locale}`} className="font-medium text-brand hover:underline">OnlineDoc Healthcare</Link>
          </span>
          {updatedLabel ? <span aria-hidden="true">·</span> : null}
          {updatedLabel ? <span>{params.locale === "sw" ? "Imesasishwa" : "Last updated"} {updatedLabel}</span> : null}
        </div>
      </header>
      <ContentSections item={item} locale={params.locale} fields={fieldMap[section]} />
      <p className="mt-9 rounded-xl bg-info-bg px-5 py-4 text-sm leading-relaxed text-primary">
        {healthLabel(params.locale, "disclaimer")}{" "}
        <Link
          href={`/${params.locale}/terms-of-service#medical-disclaimer`}
          className="font-semibold text-brand underline underline-offset-2 hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {params.locale === "sw" ? "Soma kanusho kamili la matibabu" : "Read the full medical disclaimer"}
        </Link>
      </p>
      {section === "tests" && item.generalInterpretation?.length ? <p className="mt-6 text-sm text-neutral-600">{params.locale === "sw" ? "Matokeo ya kipimo pekee hayawezi kuthibitisha utambuzi." : "A test result on its own cannot establish a diagnosis."}</p> : null}
    </article>
    <div className="mx-auto max-w-5xl">
      {related.map(group => <RelatedContent key={group.title} title={group.title} items={group.items} section={group.section} locale={params.locale} />)}
      {section === "articles" && item.dynamic_zone?.length ? <div className="mt-10"><DynamicZoneManager dynamicZone={item.dynamic_zone as never} locale={params.locale} /></div> : null}
    </div>
  </Container></main>;
}
