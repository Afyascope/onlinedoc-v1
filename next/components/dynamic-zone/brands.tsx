"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Heading } from "../elements/heading";
import { Subheading } from "../elements/subheading";
import { AnimatePresence, motion } from "framer-motion";
import { strapiImage } from "@/lib/strapi/strapiImage";

export const Brands = ({ heading, sub_heading, logos }: { heading: string, sub_heading: string, logos: any[] }) => {
  
  // 1. Initial Logic to split logos
  // Memoize the derived array so its reference is stable and can be used safely in effect deps.
  const safeLogos = useMemo(() => (Array.isArray(logos) ? logos : []), [logos]);
  
  // 2. State setup
  // We initialize state lazily or with default empty/split to prevent hydration mismatch if possible,
  // but your current setup works fine for client components.
  const middleIndex = Math.floor(safeLogos.length / 2);
  const firstHalf = safeLogos.slice(0, middleIndex);
  const secondHalf = safeLogos.slice(middleIndex);

  const [stateLogos, setLogos] = useState([firstHalf, secondHalf]);
  const [activeLogoSet, setActiveLogoSet] = useState(firstHalf);

  // 3. CRITICAL FIX: Update state when 'logos' prop changes
  useEffect(() => {
    const mid = Math.floor(safeLogos.length / 2);
    const first = safeLogos.slice(0, mid);
    const second = safeLogos.slice(mid);
    setLogos([first, second]);
    setActiveLogoSet(first);
  }, [safeLogos]); 

  // 4. The Flip Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setLogos((currentLogos) => {
        const newLogos = [...currentLogos.slice(1), currentLogos[0]];
        setActiveLogoSet(newLogos[0]);
        return newLogos;
      });
    }, 3000); // 3 seconds flip time

    return () => clearTimeout(timer);
  }, [activeLogoSet]);

  return (
    <div className="relative z-20 py-10 md:py-40 bg-charcoal">
      <Heading className="pt-4 font-primary text-white">
        {heading}
      </Heading>
      <Subheading className="max-w-3xl mx-auto text-neutral-300 font-secondary">
        {sub_heading}
      </Subheading>

      <div className="flex gap-10 flex-wrap justify-center md:gap-40 relative h-full w-full mt-20 min-h-[120px]">
        <AnimatePresence mode="popLayout">
          {activeLogoSet.map((logo, idx) => (
            <motion.div
              initial={{
                y: 40,
                opacity: 0,
                filter: "blur(10px)",
              }}
              animate={{
                y: 0,
                opacity: 1,
                filter: "blur(0px)",
              }}
              exit={{
                y: -40,
                opacity: 0,
                filter: "blur(10px)",
              }}
              transition={{
                duration: 0.8,
                delay: 0.1 * idx,
                ease: [0.4, 0, 0.2, 1],
              }}
              key={logo.id || idx}
              className="relative"
            >
              <Image
                src={strapiImage(logo.image.url)}
                alt={logo.image.alternativeText || "Brand"}
                width={400}
                height={400}
                className="md:h-20 md:w-60 h-10 w-40 object-contain filter"
                draggable={false}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};