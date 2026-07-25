"use client";
import { motion } from "framer-motion";
import React from "react";
import { Heading } from "../../elements/heading";
import { Subheading } from "../../elements/subheading";
import { Container } from "../../container";
import { FeatureIconContainer } from "../features/feature-icon-container";
/* Changed Icon to represent 'Ecosystem' */
import { TbLayoutGrid } from "react-icons/tb";
import { Card } from "./card";

export const HowItWorks = ({ heading, sub_heading, steps }: { heading: string, sub_heading: string, steps: any }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-neutral-50"
    >
      <Container className="py-20 max-w-7xl mx-auto relative z-40">
        
        <FeatureIconContainer className="flex justify-center items-center overflow-hidden bg-brand/5 border-brand/20">
          <TbLayoutGrid className="h-6 w-6 text-brand" />
        </FeatureIconContainer>
        
        <Heading className="pt-4 font-primary text-primary">
          {heading}
        </Heading>

        <Subheading className="max-w-3xl mx-auto text-neutral-700">
          {sub_heading}
        </Subheading>

        <div className="mt-10">
          {steps && steps.map((item: { title: string; description: string; image?: any }, index: number) => (
            <Card
              title={item.title}
              description={item.description}
              index={index + 1}
              image={item.image} // Pass the logo image from Strapi
              key={"card" + index}
            />
          ))}
        </div>
      </Container>
      </motion.div>
  );
};