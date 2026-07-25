"use client";
import React from "react";
// import Link from "next/link"; 
import { Heading } from "../elements/heading";
import { Subheading } from "../elements/subheading";
import { Button } from "../elements/button";

export const Hero = ({ 
  heading, 
  sub_heading, 
  CTAs, 
  locale 
}: { 
  heading: string; 
  sub_heading: string; 
  CTAs: any[], 
  locale: string 
}) => {
  return (
    <div className="h-screen overflow-hidden relative flex flex-col items-center justify-center bg-charcoal">
      
      {/* Heading */}
      <Heading
        as="h1"
        className="text-4xl md:text-5xl lg:text-7xl font-bold font-primary text-white max-w-7xl mx-auto text-center mt-6 relative z-10 py-6 leading-tight"
      >
        {/* Logic: Turns the LAST word Cyan */}
        {heading.substring(0, heading.lastIndexOf(" "))}{" "}
        <span className="text-cyan-400">
          {heading.split(" ").pop()}
        </span>
      </Heading>

      {/* Subheading */}
      <Subheading 
        className="text-center mt-2 md:mt-6 text-base md:text-xl font-secondary text-neutral-300 max-w-3xl mx-auto relative z-10 leading-relaxed px-4"
      >
        {sub_heading}
      </Subheading>

      {/* CTAs / Buttons */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 items-center mt-10 relative z-20">
        {CTAs && CTAs.map((cta, idx) => (
          <Button
            key={cta?.id || idx}
            href={cta.URL.startsWith("/") ? `/${locale}${cta.URL}` : cta.URL}
            // ✅ THE FIX: Respects Strapi variant.
            variant={cta.variant || "primary"}
          >
            {cta.text}
          </Button>
        ))}
      </div>

      {/* Gradient Overlay - Restored to 'from-charcoal' to match background */}
      <div className="absolute inset-x-0 bottom-0 h-80 w-full bg-gradient-to-t from-charcoal via-charcoal/50 to-transparent pointer-events-none" />
    </div>
  );
};