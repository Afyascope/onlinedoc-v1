"use client";
import React from "react";
import { motion } from "framer-motion";
import { Button } from "../elements/button";
import { AmbientColor } from "../decorations/ambient-color";
import { Container } from "../container";
// import Link from "next/link"; // Not needed, Button handles the link internally now

export const CTA = ({ 
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
    <div className="relative py-40 bg-charcoal overflow-hidden">
      <AmbientColor />
      <Container className="flex flex-col md:flex-row justify-between items-center w-full px-8 relative z-10">
        
        {/* Text Section */}
        <div className="flex flex-col">
          <motion.h2 className="text-white text-3xl md:text-5xl font-bold mx-auto md:mx-0 max-w-xl font-primary text-center md:text-left">
            {heading}
          </motion.h2>
          <p className="max-w-md mt-6 text-center md:text-left text-base md:text-lg mx-auto md:mx-0 text-neutral-300 font-secondary leading-relaxed">
            {sub_heading}
          </p>
        </div>

        {/* Buttons Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mt-10 md:mt-0">
          {CTAs && CTAs.map((cta, index) => (
            <Button 
              key={index || cta.id} 
              // Handle link logic safely
              href={cta.URL.startsWith("/") ? `/${locale}${cta.URL}` : cta.URL} 
              // ✅ THE FIX: Use Strapi variant. Default to 'primary' if missing.
              variant={cta.variant || 'primary'} 
              className="py-3 w-full sm:w-auto"
            >
              {cta.text}
            </Button>
          ))}
        </div>
      </Container>
    </div>
  );
};