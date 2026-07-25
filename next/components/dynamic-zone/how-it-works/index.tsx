"use client";
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
    <div className="bg-charcoal"> {/* Ensure background matches body */}
      <Container className="py-20 max-w-7xl mx-auto relative z-40">
        
        <FeatureIconContainer className="flex justify-center items-center overflow-hidden bg-lightblack/10 border-lightblack/20">
          <TbLayoutGrid className="h-6 w-6 text-lightblack" />
        </FeatureIconContainer>
        
        <Heading className="pt-4 font-primary text-white">
          {heading}
        </Heading>

        <Subheading className="max-w-3xl mx-auto text-neutral-300">
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
      </div>
  );
};