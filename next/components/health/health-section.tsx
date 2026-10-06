import { BlocksRenderer } from "@qkix/better-blocks-react-renderer";
import { HealthCard } from "@/components/health/health-card";
import { healthLabel, type HealthItem, type HealthSection } from "@/lib/health/content";

const sectionLabels: Record<string, string> = {
  overview: "overview", causes: "causes", symptoms: "symptoms", riskFactors: "riskFactors", diagnosis: "diagnosis", investigations: "investigations", treatmentAndManagement: "treatmentAndManagement", prevention: "prevention", whenToSeekCare: "whenToSeekCare", uses: "uses", generalUse: "generalUse", commonSideEffects: "commonSideEffects", precautions: "precautions", contraindications: "contraindications", whatItIs: "whatItIs", whyRequested: "whyRequested", preparation: "preparation", generalInterpretation: "generalInterpretation", instructions: "instructions", content: "content",
};

export function ContentSections({ item, locale, fields }: { item: HealthItem; locale: string; fields: string[] }) {
  return <div className="space-y-9">
    {fields.map(field => {
      const value = item[field as keyof HealthItem];
      if (!Array.isArray(value) || value.length === 0) return null;
      return <section key={field} aria-labelledby={`section-${field}`}>
        <h2 id={`section-${field}`} className="mb-3 font-primary text-2xl font-semibold text-primary">{healthLabel(locale, sectionLabels[field] || field)}</h2>
        <div className="prose prose-lg max-w-none text-neutral-700 prose-headings:font-primary prose-headings:text-primary prose-a:text-brand prose-img:rounded-xl">
          <BlocksRenderer content={value as never} />
        </div>
      </section>;
    })}
  </div>;
}

export function RelatedContent({ title, items, locale, section }: { title: string; items?: HealthItem[]; locale: string; section: HealthSection }) {
  const available = items?.filter(item => item.slug) || [];
  if (!available.length) return null;
  return <section className="mt-12 border-t border-border pt-8">
    <h2 className="mb-5 font-primary text-2xl font-semibold text-primary">{title}</h2>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{available.map(item => <HealthCard key={item.id} item={item} section={section} locale={locale} />)}</div>
  </section>;
}
