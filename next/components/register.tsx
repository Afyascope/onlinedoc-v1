"use client";
import React from "react";
import { Container } from "./container";
import { Logo } from "./logo";
import { IconCheck, IconMail, IconUser, IconBuildingHospital } from "@tabler/icons-react";

export const Register = () => {
  return (
    <Container className="min-h-screen max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center py-10 gap-10 md:gap-20">
      
      {/* LEFT COLUMN: The "Healthline Style" Pitch */}
      <div className="flex-1 text-center md:text-left">
        <Logo />
        <h1 className="text-3xl md:text-5xl font-bold font-primary mt-8 text-white leading-tight">
          Get the <span className="text-cyan-400">AfyaScope</span> <br />
          Insider.
        </h1>
        <p className="text-neutral-400 text-lg mt-6 font-secondary leading-relaxed">
          Empowering healthcare innovators with consumer insights, trends, and tech strategies.
        </p>

        {/* Simplified Value Props */}
        <div className="mt-8 space-y-4">
          <BenefitItem text="Digital Health Trends" />
          <BenefitItem text="Clinical Media Insights" />
          <BenefitItem text="Tech Implementation Strategies" />
        </div>
      </div>

      {/* RIGHT COLUMN: The Form */}
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 p-8 rounded-2xl shadow-2xl shadow-cyan-900/10 relative overflow-hidden">
        
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none" />

        <h3 className="text-xl font-bold text-white mb-2 font-primary">
          Subscribe
        </h3>
        <p className="text-neutral-400 text-sm mb-6">
          Join the network building the future of African healthcare.
        </p>

        <form className="space-y-4">
          <div className="relative">
            <IconUser className="absolute left-3 top-3.5 text-neutral-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Full Name"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-800 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-sm"
            />
          </div>

          <div className="relative">
            <IconMail className="absolute left-3 top-3.5 text-neutral-500 w-5 h-5" />
            <input
              type="email"
              placeholder="Work Email Address"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-800 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-sm"
            />
          </div>

          <div className="relative">
            <IconBuildingHospital className="absolute left-3 top-3.5 text-neutral-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Organization (Optional)"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-800 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-sm"
            />
          </div>

          {/* --- UPDATED BUTTON: White Default -> Cyan Hover --- */}
          <button className="w-full bg-white text-black font-bold h-12 rounded-xl transition-all duration-300 text-sm uppercase tracking-wide mt-2 shadow-lg hover:bg-cyan-400 hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.6)] hover:-translate-y-0.5">
            Subscribe
          </button>
          
        </form>

        <p className="text-neutral-500 text-xs mt-6 text-center">
          No spam. Unsubscribe anytime.
        </p>
      </div>

    </Container>
  );
};

const BenefitItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3">
    <div className="h-6 w-6 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
      <IconCheck className="h-3.5 w-3.5 text-cyan-400 stroke-[3px]" />
    </div>
    <span className="text-neutral-300 font-medium">{text}</span>
  </div>
);