import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading";
import { HealthSearch } from "@/components/health/health-search";
import fetchContentType from "@/lib/strapi/fetchContentType";
import { healthSections, sectionTitle, healthLabel, type HealthListResponse, type HealthSection } from "@/lib/health/content";

function sectionFromParam(value: string): HealthSection | undefined {
  return (Object.keys(healthSections) as HealthSection[]).find(key => healthSections[key].route === value);
}

export async function generateMetadata({ params }: { params: { locale: string; section: string } }): Promise<Metadata> {
  const section = sectionFromParam(params.section);
  if (!section) return {};
  const title = sectionTitle(section, params.locale);
  const description = healthSections[section].intro[params.locale] || healthSections[section].intro.en;
  return { title, description, openGraph: { title, description, locale: params.locale, siteName: "OnlineDoc Healthcare" } };
}

export default async function HealthListing({ params }: { params: { locale: string; section: string } }) {
  const section = sectionFromParam(params.section);
  if (!section) notFound();
  const result = await fetchContentType(healthSections[section].api, { filters: { locale: params.locale }, sort: ["publishedAt:desc"] }) as HealthListResponse | null;
  const items = result?.data?.filter(item => item.slug && (item.title || item.name)) || [];
  return <main className="py-12 md:py-16"><Container>
    <header className="mb-9 max-w-3xl">
      <p className="mb-2 text-sm font-semibold text-brand"><a className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" href={`/${params.locale}/health`}>{healthLabel(params.locale, "library")}</a></p>
      <Heading as="h1">{sectionTitle(section, params.locale)}</Heading>
      <Subheading className="mt-3">{healthSections[section].intro[params.locale] || healthSections[section].intro.en}</Subheading>
    </header>
    <HealthSearch items={items} section={section} locale={params.locale} />
  </Container></main>;
}
