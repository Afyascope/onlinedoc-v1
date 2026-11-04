import Image from "next/image";
import { Container } from "../container";
import { Button } from "../elements/button";
import { Link } from "next-view-transitions";
import { strapiImage } from "@/lib/strapi/strapiImage";

interface HeroCTA {
  id?: number;
  text: string;
  URL: string;
  target?: string | null;
  variant?: "simple" | "outline" | "primary" | "muted";
}

interface HeroMedia {
  url?: string;
  alternativeText?: string | null;
}

function getSafeImageSrc(url?: string | null): string | null {
  if (!url || url.trim() !== url || url.startsWith("//")) return null;
  if (url.startsWith("/api/media/")) return url;
  if (url.startsWith("/") && !process.env.NEXT_PUBLIC_API_URL) return null;

  try {
    const resolved = strapiImage(url);
    const parsed = new URL(resolved);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? resolved : null;
  } catch {
    return null;
  }
}

export const Hero = ({
  heading,
  sub_heading,
  eyebrow,
  CTAs,
  backgroundImage,
  locale,
  isHomepageHero = false,
}: {
  heading?: string;
  sub_heading?: string;
  eyebrow?: string;
  CTAs?: HeroCTA[];
  backgroundImage?: HeroMedia | null;
  locale: string;
  isHomepageHero?: boolean;
}) => {
  if (isHomepageHero) {
    const imageSrc = getSafeImageSrc(backgroundImage?.url);
    const homepageCtas = (CTAs || [])
      .filter((cta) => typeof cta?.text === "string" && cta.text.trim() && typeof cta.URL === "string" && cta.URL.trim())
      .slice(0, 2);

    return (
      <section
        aria-labelledby={heading ? "homepage-hero-title" : undefined}
        className="relative z-40 isolate flex min-h-[640px] w-full items-center overflow-hidden bg-gradient-to-br from-[#0F2A43] via-[#123b55] to-[#0f766e] text-white md:min-h-[680px] lg:min-h-[720px]"
      >
        {imageSrc && (
          <Image
            src={imageSrc}
            alt={backgroundImage?.alternativeText?.trim() || ""}
            fill
            priority
            quality={85}
            sizes="100vw"
            className="z-0 object-cover object-[72%_center] md:object-[65%_center]"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(15,42,67,0.96)_0%,rgba(15,42,67,0.86)_38%,rgba(15,42,67,0.54)_68%,rgba(15,42,67,0.2)_100%)] max-md:bg-[linear-gradient(90deg,rgba(15,42,67,0.91)_0%,rgba(15,42,67,0.76)_100%)]"
        />
        <Container className="relative z-20 w-full py-36 md:py-40 lg:py-44">
          <div className="max-w-[760px]">
            {eyebrow && (
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#a8eef0] sm:text-sm">
                {eyebrow}
              </p>
            )}
            {heading && (
              <h1
                id="homepage-hero-title"
                className="font-primary text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
              >
                {heading}
              </h1>
            )}
            {sub_heading && (
              <p className="mt-6 max-w-[590px] text-base leading-relaxed text-white/90 sm:text-lg md:mt-7 md:text-xl">
                {sub_heading}
              </p>
            )}
            {homepageCtas.length ? (
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4 md:mt-10">
                {homepageCtas.map((cta, index) => (
                  <Button
                    key={cta.id ?? cta.text}
                    as={Link}
                    href={cta.URL.startsWith("/") ? `/${locale}${cta.URL}` : cta.URL}
                    target={cta.target || undefined}
                    rel={cta.target === "_blank" ? "noopener noreferrer" : undefined}
                    variant={index === 0 ? "primary" : "outline"}
                    className={index === 1 ? "!border-white/70 !bg-transparent !text-white hover:!border-white hover:!bg-white/15" : ""}
                  >
                    {cta.text}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="relative bg-neutral-50">
      <Container className="grid grid-cols-1 items-center gap-12 pt-32 pb-16 lg:grid-cols-2 lg:gap-16 lg:pt-40 lg:pb-24">
        <div className="max-w-xl">
          <h1 className="font-primary text-left text-4xl font-bold leading-tight tracking-tight text-primary md:text-5xl lg:text-6xl">
            {heading}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-neutral-700 md:text-lg">
            {sub_heading}
          </p>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
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
        <div aria-hidden="true" className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-derek md:p-8">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E0FCFF] font-primary font-bold text-brand">Dr</div>
              <div>
                <p className="text-sm font-bold text-primary">Dr. Amara Okoye</p>
                <p className="text-xs text-neutral-500">General practitioner</p>
              </div>
            </div>
            <div className="space-y-4 py-6">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm border border-border bg-neutral-50 px-4 py-3">
                <p className="text-sm text-neutral-700">I&apos;ve had a sore throat and a fever for two days. Should I be worried?</p>
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-[#E0FCFF] px-4 py-3">
                <p className="text-sm text-neutral-800">Thanks for letting me know. Let me ask a few quick questions to guide you.</p>
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-[#E0FCFF] px-4 py-3">
                <p className="text-sm text-neutral-800">You can share everything right here — no clinic visit needed.</p>
              </div>
            </div>
            <div className="flex items-center rounded-full border border-border bg-neutral-50 px-4 py-3">
              <span className="text-sm text-neutral-400">Type your symptoms…</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
