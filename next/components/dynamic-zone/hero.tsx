import { Container } from "../container";
import { Button } from "../elements/button";
import { Link } from "next-view-transitions";

interface HeroCTA {
  id?: number;
  text: string;
  URL: string;
  target?: string | null;
  variant?: "simple" | "outline" | "primary" | "muted";
}

export const Hero = ({
  heading,
  sub_heading,
  CTAs,
  locale,
}: {
  heading: string;
  sub_heading: string;
  CTAs?: HeroCTA[];
  locale: string;
}) => {
  return (
    <section className="relative bg-neutral-50">
      <Container className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-16 pt-32 lg:pt-40 pb-16 lg:pb-24">
        {/* Left column: patient-facing message */}
        <div className="max-w-xl">
          <h1 className="font-primary font-bold text-primary text-left tracking-tight text-4xl md:text-5xl lg:text-6xl leading-tight">
            {heading}
          </h1>

          <p className="mt-6 text-base md:text-lg text-neutral-700 leading-relaxed">
            {sub_heading}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {CTAs?.map((cta) => (
              <Button
                key={cta.id ?? cta.text}
                as={Link}
                href={cta.URL.startsWith("/") ? `/${locale}${cta.URL}` : cta.URL}
                target={cta.target || undefined}
                variant={cta.variant || "primary"}
              >
                {cta.text}
              </Button>
            ))}
          </div>
        </div>

        {/* Right column: decorative consultation visual */}
        <div
          aria-hidden="true"
          className="relative mx-auto lg:mx-0 lg:ml-auto w-full max-w-md"
        >
          <div className="rounded-3xl bg-white border border-border shadow-derek p-6 md:p-8">
            {/* Clinician header */}
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="h-11 w-11 rounded-full bg-[#E0FCFF] text-brand font-primary font-bold flex items-center justify-center">
                Dr
              </div>
              <div>
                <p className="text-sm font-bold text-primary">Dr. Amara Okoye</p>
                <p className="text-xs text-neutral-500">General practitioner</p>
              </div>
            </div>

            {/* Conversation */}
            <div className="space-y-4 py-6">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-neutral-50 border border-border px-4 py-3">
                <p className="text-sm text-neutral-700">
                  I&apos;ve had a sore throat and a fever for two days. Should I
                  be worried?
                </p>
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-[#E0FCFF] px-4 py-3">
                <p className="text-sm text-neutral-800">
                  Thanks for letting me know. Let me ask a few quick questions
                  to guide you.
                </p>
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-[#E0FCFF] px-4 py-3">
                <p className="text-sm text-neutral-800">
                  You can share everything right here — no clinic visit needed.
                </p>
              </div>
            </div>

            {/* Composer */}
            <div className="flex items-center rounded-full bg-neutral-50 border border-border px-4 py-3">
              <span className="text-sm text-neutral-400">Type your symptoms…</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
