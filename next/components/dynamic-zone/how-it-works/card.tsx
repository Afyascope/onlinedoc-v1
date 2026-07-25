"use client";

import React, { MouseEvent as ReactMouseEvent, useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useSpring,
} from "framer-motion";
import { CanvasRevealEffect } from "../../ui/canvas-reveal-effect";
import Beam from "../../beam";
import { strapiImage } from "@/lib/strapi/strapiImage"; // Ensure this import exists

export const Card = ({
  title,
  description,
  index,
  image,
}: {
  title: string;
  description: string;
  index: number;
  image?: any;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: ReactMouseEvent<HTMLDivElement>) {
    let { left, top } = currentTarget.getBoundingClientRect();

    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["end end", "start start"],
  });

  const width = useSpring(useTransform(scrollYProgress, [0, 0.2], [0, 300]), {
    stiffness: 500,
    damping: 90,
  });

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 md:grid-cols-4 max-w-4xl mx-auto py-20 gap-8 items-center"
    >
      {/* LEFT SIDE: LOGO or NUMBER */}
      <div className="flex justify-center md:justify-end md:pr-10">
        {image?.url ? (
          <div className="relative h-24 w-24 md:h-32 md:w-32 bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-center backdrop-blur-sm shadow-xl">
             <Image 
               src={strapiImage(image.url)} 
               alt={title} 
               width={100} 
               height={100} 
               className="object-contain w-full h-full"
             />
          </div>
        ) : (
          <p className="text-9xl font-bold text-neutral-800 opacity-50 font-primary">
            {"0" + index}
          </p>
        )}
      </div>

      {/* MIDDLE: CONNECTION BEAM */}
      <motion.div
        className="h-[2px] w-full hidden md:block bg-neutral-800 rounded-full mt-0 relative overflow-hidden"
        style={{ width }}
      >
        <Beam className="top-[0.5px] bg-lightblack" /> {/* Cyan Beam */}
      </motion.div>

      {/* RIGHT SIDE: CONTENT CARD */}
      <div
        className="group p-8 rounded-xl border border-white/10 bg-charcoal/50 backdrop-blur-md relative z-40 col-span-2 shadow-2xl transition-transform duration-300 hover:-translate-y-1"
        onMouseMove={handleMouseMove}
      >
        {/* Hover Effect: Cyan & Red */}
        <motion.div
          className="pointer-events-none absolute z-10 -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            maskImage: useMotionTemplate`
            radial-gradient(
              350px circle at ${mouseX}px ${mouseY}px,
              var(--neutral-900),
              transparent 80%
            )
          `,
          }}
        >
          <CanvasRevealEffect
            animationSpeed={3}
            containerClassName="bg-transparent absolute inset-0 pointer-events-none"
            colors={[
              [0, 194, 203], // Afyascope Cyan
              [255, 77, 77], // Afyascope Red
            ]}
            dotSize={2}
          />
        </motion.div>

        <h3 className="text-2xl font-bold font-primary text-white relative z-20 mt-2">
          {title}
        </h3>
        <p className="text-neutral-300 font-secondary text-sm leading-relaxed mt-4 relative z-20">
          {description}
        </p>
      </div>
    </div>
  );
};