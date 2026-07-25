"use client";

import React from "react";
import { Container } from "../container";
import { FeatureIconContainer } from "./features/feature-icon-container";
import { Heading } from "../elements/heading";
import { Subheading } from "../elements/subheading";
import { IconCheck, IconPlus, IconBriefcase } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "../elements/button";

type Perks = {
  [key: string]: string;
}

type CTA = {
  [key: string]: string;
}

type Plan = {
  name: string;
  price: number;
  perks: Perks[];
  additional_perks: Perks[];
  description: string;
  number: string;
  featured?: boolean;
  CTA?: CTA | undefined;
};

export const Pricing = ({ heading, sub_heading, plans }: { heading: string, sub_heading: string, plans: any[] }) => {
  const onClick = (plan: Plan) => {
    // Replace this with your actual booking link or WhatsApp logic
    window.open("https://wa.me/254700000000", "_blank");
  };
  
  return (
    <div className="pt-20 pb-20 relative z-20">
      <Container>
        <FeatureIconContainer className="flex justify-center items-center overflow-hidden bg-charcoal">
          {/* Changed Icon to Briefcase for 'Services' vibe */}
          <IconBriefcase className="h-6 w-6 text-white" />
        </FeatureIconContainer>
        
        <Heading className="pt-4 text-white">{heading}</Heading>
        
        <Subheading className="max-w-3xl mx-auto text-neutral-400">
          {sub_heading}
        </Subheading>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto gap-6 py-20 lg:items-start">
          {plans.map((plan) => (
            <Card onClick={() => onClick(plan)} key={plan.name} plan={plan} />
          ))}
        </div>
      </Container>
    </div>
  );
};

const Card = ({ plan, onClick }: { plan: Plan; onClick: () => void }) => {
  return (
    <div
      className={cn(
        "p-4 md:p-6 rounded-3xl bg-neutral-900/50 border border-white/10 flex flex-col h-full",
        plan.featured && "bg-white border-neutral-200"
      )}
    >
      <div className="flex-1">
         {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <p className={cn("font-bold text-xl font-primary", plan.featured ? "text-black" : "text-white")}>
            {plan.name}
          </p>
          {plan.featured && (
            <div
              className={cn(
                "font-medium text-[10px] uppercase tracking-wider px-3 py-1 rounded-full relative bg-black text-white"
              )}
            >
              Recommended
            </div>
          )}
        </div>

        {/* DESCRIPTION (Replaces Price) */}
        <div className="mb-8 min-h-[80px]">
          <p className={cn(
             "text-sm leading-relaxed font-secondary", 
             plan.featured ? "text-neutral-600" : "text-neutral-400"
          )}>
            {plan.description}
          </p>
        </div>

        {/* BUTTON */}
        <Button
          variant="outline"
          className={cn(
            "w-full mb-8 font-primary font-bold tracking-wide",
            plan.featured 
              ? "bg-[#FF4D4D] text-white hover:bg-[#FF4D4D]/90 border-transparent" 
              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          )}
          onClick={onClick}
        >
          {plan?.CTA?.text || "Book Consultation"}
        </Button>

        <Divider featured={plan.featured} />

        {/* PERKS LIST */}
        <div className="mt-8 flex flex-col gap-4">
          {plan.perks.map((feature, idx) => (
            <Step featured={plan.featured} key={idx}>
              {feature.text}
            </Step>
          ))}
        </div>
      </div>
    </div>
  );
};

const Step = ({
  children,
  additional,
  featured,
}: {
  children: React.ReactNode;
  additional?: boolean;
  featured?: boolean;
}) => {
  return (
    <div className="flex items-start justify-start gap-3">
      <div
        className={cn(
          "h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
          featured ? "bg-indigo-100" : "bg-neutral-800"
        )}
      >
        <IconCheck className={cn("h-3 w-3 [stroke-width:3px]", featured ? "text-indigo-600" : "text-neutral-400")} />
      </div>
      <div
        className={cn(
          "font-medium text-sm font-secondary leading-snug",
          featured ? "text-neutral-700" : "text-neutral-300"
        )}
      >
        {children}
      </div>
    </div>
  );
};

const Divider = ({ featured }: { featured?: boolean }) => {
  return (
    <div className="relative w-full">
      <div
        className={cn("w-full h-px bg-neutral-800", featured && "bg-neutral-200")}
      />
    </div>
  );
};