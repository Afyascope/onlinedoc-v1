"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";
import Marquee from "react-fast-marquee";
import { strapiImage } from "@/lib/strapi/strapiImage";

export const TestimonialsMarquee = ({ testimonials }: { testimonials: any }) => {
  // Fallback: If no testimonials exist, don't crash the page.
  if (!testimonials || testimonials.length === 0) return null;

  // Split content for the two rows
  const levelOne = testimonials.slice(0, Math.ceil(testimonials.length / 2));
  const levelTwo = testimonials.slice(Math.ceil(testimonials.length / 2));

  return (
    <div className="max-w-7xl mx-auto py-20 overflow-hidden relative z-20">
      
      {/* ROW 1: Scroll Left */}
      <div className="flex h-full relative">
        {/* FADE EFFECT: Using #020617 (Deep Navy) to match your site background */}
        <div className="h-full absolute w-20 md:w-40 left-0 inset-y-0 z-30 bg-gradient-to-r from-[#020617] via-[#020617]/80 to-transparent pointer-events-none" />
        <div className="h-full absolute w-20 md:w-40 right-0 inset-y-0 z-30 bg-gradient-to-l from-[#020617] via-[#020617]/80 to-transparent pointer-events-none" />
        
        <Marquee pauseOnHover gradient={false} speed={40}>
          {levelOne.map((testimonial: any, index: any) => (
            <Card
              key={`testimonial-${testimonial.id}-${index}`}
              className="w-[350px] md:w-[450px] mx-4 h-full min-h-[220px] flex flex-col justify-between"
            >
              <Quote>{testimonial?.text}</Quote>
              <div className="flex gap-3 items-center mt-6 border-t border-white/5 pt-4">
                {testimonial?.user?.image?.url ? (
                   <Image
                     src={strapiImage(testimonial.user.image.url)}
                     alt={`${testimonial.user.firstname} ${testimonial.user.lastname}`}
                     width={40}
                     height={40}
                     className="rounded-full ring-2 ring-white/10"
                   />
                ) : (
                   /* Fallback avatar if no image exists */
                   <div className="h-10 w-10 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400 font-bold text-xs ring-2 ring-white/10">
                      {testimonial.user.firstname?.[0]}{testimonial.user.lastname?.[0]}
                   </div>
                )}
                <div className="flex flex-col">
                  <QuoteDescription className="text-white font-bold">
                    {`${testimonial.user.firstname} ${testimonial.user.lastname}`}
                  </QuoteDescription>
                  <QuoteDescription className="text-indigo-400 text-xs uppercase tracking-wider">
                    {testimonial.user.job}
                  </QuoteDescription>
                </div>
              </div>
            </Card>
          ))}
        </Marquee>
      </div>

      {/* ROW 2: Scroll Right (Only shows if you have enough data) */}
      {levelTwo.length > 0 && (
        <div className="flex h-full relative mt-8">
           <div className="h-full absolute w-20 md:w-40 left-0 inset-y-0 z-30 bg-gradient-to-r from-[#020617] via-[#020617]/80 to-transparent pointer-events-none" />
           <div className="h-full absolute w-20 md:w-40 right-0 inset-y-0 z-30 bg-gradient-to-l from-[#020617] via-[#020617]/80 to-transparent pointer-events-none" />
           
           <Marquee direction="right" pauseOnHover gradient={false} speed={30}>
            {levelTwo.map((testimonial: any, index: any) => (
              <Card
                key={`testimonial-${testimonial.id}-${index}`}
                className="w-[350px] md:w-[450px] mx-4 h-full min-h-[220px] flex flex-col justify-between"
              >
                <Quote>{testimonial.text}</Quote>
                <div className="flex gap-3 items-center mt-6 border-t border-white/5 pt-4">
                  {testimonial?.user?.image?.url ? (
                    <Image
                      src={strapiImage(testimonial.user.image.url)}
                      alt={`${testimonial.user.firstname} ${testimonial.user.lastname}`}
                      width={40}
                      height={40}
                      className="rounded-full ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400 font-bold text-xs ring-2 ring-white/10">
                        {testimonial.user.firstname?.[0]}{testimonial.user.lastname?.[0]}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <QuoteDescription className="text-white font-bold">
                      {`${testimonial.user.firstname} ${testimonial.user.lastname}`}
                    </QuoteDescription>
                    <QuoteDescription className="text-indigo-400 text-xs uppercase tracking-wider">
                      {testimonial.user.job}
                    </QuoteDescription>
                  </div>
                </div>
              </Card>
            ))}
          </Marquee>
        </div>
      )}
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl bg-neutral-900/40 border border-white/5 backdrop-blur-sm transition-all duration-300",
        "hover:border-indigo-500/30 hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.2)]", // Hover Glow Effect
        className
      )}
    >
      {children}
    </div>
  );
};

export const Quote = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h3 className={cn("text-lg font-secondary font-medium text-neutral-200 leading-relaxed italic", className)}>
      &quot;{children}&quot;
    </h3>
  );
};

export const QuoteDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={cn("text-sm font-normal text-neutral-200 max-w-sm", className)}
    >
      {children}
    </p>
  );
};