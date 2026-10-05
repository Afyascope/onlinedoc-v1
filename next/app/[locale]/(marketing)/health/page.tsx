import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading";
import { healthLabel, healthSections, sectionTitle, type HealthSection } from "@/lib/health/content";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const title = healthLabel(params.locale, "library");
  return { title, description: healthLabel(params.locale, "intro"), openGraph: { title, description: healthLabel(params.locale, "intro"), locale: params.locale, siteName: "OnlineDoc Healthcare" } };
}

const icons: Record<HealthSection, string> = { conditions: "♡", medicines: "+", tests: "⌕", guides: "↗", nutrition: "◌", articles: "✎" };

export default function HealthHome({ params }: { params: { locale: string } }) {
  return <main className="py-12 md:py-20">
    <Container>
      <header className="mx-auto max-w-3xl py-8 text-center md:py-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand">OnlineDoc</p>
        <Heading as="h1">{healthLabel(params.locale, "library")}</Heading>
        <Subheading className="mx-auto mt-4 max-w-2xl">{healthLabel(params.locale, "intro")}</Subheading>
        <p className="mt-6 text-base font-medium text-neutral-700">{healthLabel(params.locale, "explore")}</p>
      </header>
      <nav aria-label={healthLabel(params.locale, "explore")} className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(healthSections) as HealthSection[]).map(section => <Link key={section} href={`/${params.locale}/health/${healthSections[section].route}`} className="group flex min-h-36 items-center gap-4 rounded-2xl border border-border bg-white p-6 transition hover:border-brand/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
          <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-info-bg font-primary text-2xl font-semibold text-brand">{icons[section]}</span>
          <span className="font-primary text-lg font-semibold text-primary group-hover:text-brand">{sectionTitle(section, params.locale)}</span>
        </Link>)}
      </nav>
    </Container>
  </main>;
}
