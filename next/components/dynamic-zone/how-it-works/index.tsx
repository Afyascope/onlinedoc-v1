import { Container } from "../../container";
import { Card, type PathwayStep } from "./card";

export const HowItWorks = ({
  heading,
  sub_heading,
  steps,
  locale,
}: {
  heading: string;
  sub_heading: string;
  steps?: PathwayStep[];
  locale: string;
}) => {
  return (
    <section className="relative bg-white">
      <Container className="py-20 md:py-24">
        <div className="max-w-2xl">
          <h2 className="font-primary font-bold text-primary text-left tracking-tight text-3xl md:text-4xl leading-tight">
            {heading}
          </h2>
          <p className="mt-4 text-base md:text-lg text-neutral-700 leading-relaxed">
            {sub_heading}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps?.map((step) => (
            <Card key={step.id ?? step.title} step={step} locale={locale} />
          ))}
        </div>
      </Container>
    </section>
  );
};
