"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Use your utility for cleaner classes

export const Cover = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        // Base: Inline block with padding
        "relative inline-block px-2 py-1",
        // Color: Dark Navy background (matches your theme) instead of generic gray
        "bg-[#001f3f] text-white",
        // Optional: Add a subtle border to define edges
        "border border-white/10 rounded-sm",
        className
      )}
    >
      <span className="relative z-10">{children}</span>
      
      {/* Corner Rivets (The pulsing dots) */}
      <CircleIcon className="absolute -right-[2px] -top-[2px]" />
      <CircleIcon className="absolute -bottom-[2px] -right-[2px]" delay={0.4} />
      <CircleIcon className="absolute -left-[2px] -top-[2px]" delay={0.8} />
      <CircleIcon className="absolute -bottom-[2px] -left-[2px]" delay={1.6} />
    </div>
  );
};

export const CircleIcon = ({
  className,
  delay,
}: {
  className?: string;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{
        opacity: 0.2,
      }}
      animate={{
        opacity: [0.2, 0.5, 0.2], // Pulses from dim to bright
      }}
      transition={{
        duration: 1,
        delay: delay ?? 0,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "linear",
        repeatDelay: delay,
      }}
      // CHANGED: bg-white -> bg-[#00c2cb] (AfyaScope Cyan)
      // This makes the rivets look like glowing LED indicators
      className={cn(
        "pointer-events-none h-1.5 w-1.5 rounded-full bg-[#00c2cb] opacity-50 shadow-[0_0_5px_#00c2cb]",
        className
      )}
    ></motion.div>
  );
};