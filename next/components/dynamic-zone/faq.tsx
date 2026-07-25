"use client";

import { Container } from "@/components/container";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading"; 
import { FeatureIconContainer } from "./features/feature-icon-container";
import { IconHelpHexagonFilled } from "@tabler/icons-react";

export const FAQ = ({ heading, sub_heading, faqs }: { heading: string, sub_heading: string, faqs: any[] }) => {
  return (
    <Container className="flex flex-col items-center justify-between pb-20 relative z-20">
      
      {/* HEADER SECTION */}
      <div className="pt-20 md:pt-40 text-center max-w-3xl mx-auto">
        <FeatureIconContainer className="flex justify-center items-center overflow-hidden bg-charcoal mx-auto">
          <IconHelpHexagonFilled className="h-6 w-6 text-white" />
        </FeatureIconContainer>
        <Heading as="h1" className="mt-4">
          {heading}
        </Heading>
        {/* FIXED: Added the missing Subheading here */}
        <Subheading className="mt-4 text-neutral-400">
          {sub_heading}
        </Subheading>
      </div>
      
      {/* GRID SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 py-20">
        {faqs && faqs.map((faq: { question: string, answer: string }) => (
          <div 
            key={faq.question} 
            className="p-6 rounded-2xl bg-neutral-900/30 border border-white/5 hover:border-white/10 transition-colors"
          >
            <h4 className="text-lg font-bold text-white font-primary leading-snug">
              {faq.question}
            </h4>
            <p className="mt-3 text-neutral-400 font-secondary text-sm leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </Container>
  );
};