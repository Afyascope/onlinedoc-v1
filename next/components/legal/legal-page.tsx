import Link from "next/link";

export type LegalSection = { title: string; id?: string; paragraphs?: string[]; bullets?: string[] };

export function LegalPage({ title, sections, locale }: { title: string; sections: LegalSection[]; locale: string }) {
  return (
    <main className="bg-surface px-5 py-12 sm:px-8 sm:py-16">
      <article className="mx-auto w-full max-w-[760px] break-words">
        <header className="mb-10 border-b border-border pb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">OnlineDoc Legal</p>
          <h1 className="text-3xl leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-5 text-sm leading-6 text-neutral-600">Effective date: 4 October 2026<br />Last updated: 4 October 2026</p>
        </header>
        <div className="space-y-9">
          {sections.map((section) => (
            <section key={section.title} id={section.id} className="scroll-mt-24">
              <h2 className="mb-3 text-xl leading-snug sm:text-2xl">{section.title}</h2>
              {section.paragraphs?.map((paragraph, index) => <p key={index} className="mb-3 text-base leading-7 text-neutral-700">{paragraph === "CONTACT_PAGE_LINK" ? <>Use our <ContactPageLink locale={locale} /> to contact OnlineDoc.</> : paragraph}</p>)}
              {section.bullets && <ul className="ml-6 list-disc space-y-2 text-base leading-7 text-neutral-700">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

export function ContactPageLink({ locale }: { locale: string }) {
  return <Link className="font-medium text-brand underline underline-offset-4 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand" href={`/${locale}/contact`}>Contact page</Link>;
}
