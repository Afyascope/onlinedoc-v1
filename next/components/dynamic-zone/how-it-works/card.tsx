import { Button } from "../../elements/button";
import { Link } from "next-view-transitions";

export interface PathwayCTA {
  id?: number;
  text: string;
  URL: string;
  target?: string | null;
  variant?: "simple" | "outline" | "primary" | "muted";
}

export interface PathwayStep {
  id?: number;
  title: string;
  description: string;
  CTA?: PathwayCTA | null;
}

export const Card = ({
  step,
  locale,
}: {
  step: PathwayStep;
  locale: string;
}) => {
  const cta = step.CTA;

  return (
    <div className="flex flex-col h-full rounded-xl bg-white border border-border shadow-derek p-6 md:p-8">
      <h3 className="text-lg md:text-xl font-bold font-primary text-primary leading-snug">
        {step.title}
      </h3>
      <p className="mt-3 flex-1 text-sm md:text-base text-neutral-600 leading-relaxed font-secondary">
        {step.description}
      </p>
      {cta && cta.text && cta.URL && (
        <div className="mt-6">
          <Button
            as={Link}
            href={cta.URL.startsWith("/") ? `/${locale}${cta.URL}` : cta.URL}
            target={cta.target || undefined}
            variant={cta.variant || "outline"}
            className="w-full sm:w-auto"
          >
            {cta.text}
          </Button>
        </div>
      )}
    </div>
  );
};
