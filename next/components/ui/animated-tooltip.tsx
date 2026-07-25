"use client";
import Image from "next/image";
import React, { useState } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { strapiImage } from "@/lib/strapi/strapiImage";

export const AnimatedTooltip = ({
  items,
}: {
  items: {
    id: number;
    firstname: string;
    lastname: string;
    job: string;
    image: any;
  }[];
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);
  
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig
  );
  
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig
  );

  const handleMouseMove = (event: any) => {
    const halfWidth = event.target.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth);
  };

  return (
    <>
      {items.map((item) => (
        <div
          className="-mr-4 relative group"
          key={item.id} // Changed key to ID for better uniqueness
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                // CHANGE 1: bg-black -> bg-[#001f3f] (AfyaScope Navy)
                className="absolute -top-16 -left-1/2 translate-x-1/2 flex text-xs flex-col items-center justify-center rounded-md bg-[#001f3f] z-50 shadow-xl px-4 py-2"
              >
                {/* CHANGE 2: Gradients updated to Cyan (#00c2cb) and Blue */}
                <div className="absolute inset-x-10 z-30 w-[20%] -bottom-px bg-gradient-to-r from-transparent via-[#00c2cb] to-transparent h-px " />
                <div className="absolute left-10 w-[40%] z-30 -bottom-px bg-gradient-to-r from-transparent via-blue-500 to-transparent h-px " />
                
                <div className="font-bold text-white relative z-30 text-base">
                  {`${item.firstname} ${item.lastname}`}
                </div>
                {/* CHANGE 3: Changed text-white to text-gray-300 for hierarchy */}
                <div className="text-gray-300 text-xs">{item.job}</div>
              </motion.div>
            )}
          </AnimatePresence>
          <Image
            onMouseMove={handleMouseMove}
            height={100}
            width={100}
            src={strapiImage(item.image.url)}
            alt={item.image.alternativeText || "Team member"}
            // CHANGE 4: Added border-[#001f3f] to separate images cleanly on dark backgrounds
            className="object-cover !m-0 !p-0 object-top rounded-full h-14 w-14 border-2 group-hover:scale-105 group-hover:z-30 border-[#001f3f] relative transition duration-500"
          />
        </div>
      ))}
    </>
  );
};