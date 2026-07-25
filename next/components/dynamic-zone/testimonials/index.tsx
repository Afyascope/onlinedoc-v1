"use client";
import React from "react";
import { TestimonialsSlider } from "./slider";
import { FeatureIconContainer } from "../features/feature-icon-container";
import { Heading } from "../../elements/heading";
import { Subheading } from "../../elements/subheading";
/* CHANGED: Medical Icon */
import { TbActivity } from "react-icons/tb"; 
import { TestimonialsMarquee } from "./testimonials-marquee";
import { AmbientColor } from "../../decorations/ambient-color";

export const Testimonials = ({ heading, sub_heading, testimonials }: { heading: string, sub_heading: string, testimonials: object }) => {
  return (
    <div className="relative bg-charcoal overflow-hidden">
      <AmbientColor />
      <div className="pb-20 relative z-10">
        <FeatureIconContainer className="flex justify-center items-center overflow-hidden bg-lightblack/10 border-lightblack/20">
          {/* Medical Pulse Icon */}
          <TbActivity className="h-6 w-6 text-lightblack" />
        </FeatureIconContainer>
        
        <Heading className="pt-4 font-primary text-white">
            {heading}
        </Heading>
        
        <Subheading className="text-neutral-300 font-secondary">
          {sub_heading}
        </Subheading>
      </div>

      {testimonials && (
        <div className="relative md:py-20 pb-20 z-10">
          <TestimonialsSlider testimonials={testimonials} />
          
          {/* Marquee Section: Useful for Hospital Partners */}
          <div className="h-full w-full mt-20 border-t border-neutral-800 bg-charcoal/50 backdrop-blur-sm pt-10">
            <TestimonialsMarquee testimonials={testimonials} />
          </div>
        </div>
      )}
     
     {/* Bottom Fade */}
      <div className="absolute bottom-0 inset-x-0 h-40 w-full bg-gradient-to-t from-charcoal to-transparent pointer-events-none"></div>
    </div>
  );
};