"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/container";
import { Heading } from "@/components/elements/heading";
import { Subheading } from "@/components/elements/subheading"; 
import { FeatureIconContainer } from "./features/feature-icon-container";
import { IconHelpHexagonFilled } from "@tabler/icons-react";

export const FAQ = ({ heading, sub_heading, faqs }: { heading: string, sub_heading: string, faqs: any[] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Container className="flex flex-col items-center justify-between pb-20 relative z-20">
      
      {/* HEADER SECTION */}
      <div className="pt-20 md:pt-40 text-center max-w-3xl mx-auto">
        <FeatureIconContainer className="flex justify-center items-center overflow-hidden bg-neutral-50 mx-auto">
          <IconHelpHexagonFilled className="h-6 w-6 text-primary" />
        </FeatureIconContainer>
        <Heading as="h1" className="mt-4">
          {heading}
        </Heading>
        {/* FIXED: Added the missing Subheading here */}
        <Subheading className="mt-4 text-neutral-600">
          {sub_heading}
        </Subheading>
      </div>
      
      {/* GRID SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 py-20">
        {faqs && faqs.map((faq: { question: string, answer: string }) => (
          <div 
            key={faq.question} 
            className="p-6 rounded-2xl bg-white border border-border/50 hover:border-border transition-colors"
          >
            <h4 className="text-lg font-bold text-primary font-primary leading-snug">
              {faq.question}
            </h4>
            <p className="mt-3 text-neutral-600 font-secondary text-sm leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </Container>
    </motion.div>
  );
};