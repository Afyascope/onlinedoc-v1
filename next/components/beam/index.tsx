"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";
import styles from "./styles.module.css"; // Ensure this file exists as discussed before

const Beam = ({
  showBeam = true,
  className,
}: {
  showBeam?: boolean;
  className?: string;
}) => {
  const meteorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const meteor = meteorRef.current;

    if (showBeam && meteor) {
      const handleAnimationEnd = () => {
        meteor.style.visibility = "hidden";
        const animationDelay = Math.floor(Math.random() * (2 - 0) + 0);
        const animationDuration = Math.floor(Math.random() * (4 - 0) + 0);
        const meteorWidth = Math.floor(Math.random() * (150 - 80) + 80);
        meteor.style.setProperty("--meteor-delay", `${animationDelay}s`);
        meteor.style.setProperty("--meteor-duration", `${animationDuration}s`);
        meteor.style.setProperty("--meteor-width", `${meteorWidth}px`);

        restartAnimation();
      };

      const handleAnimationStart = () => {
        meteor.style.visibility = "visible";
      };

      meteor.addEventListener("animationend", handleAnimationEnd);
      meteor.addEventListener("animationstart", handleAnimationStart);

      return () => {
        meteor.removeEventListener("animationend", handleAnimationEnd);
        meteor.removeEventListener("animationstart", handleAnimationStart);
      };
    }
  }, [showBeam]);

  const restartAnimation = () => {
    const meteor = meteorRef.current;
    if (!meteor) return;
    meteor.style.animation = "none";
    void meteor.offsetWidth;
    meteor.style.animation = "";
  };

  return (
    showBeam && (
      <span
        ref={meteorRef}
        className={cn(
          // FIX: Changed bg-blue-700 to bg-[#00c2cb] to match your AfyaScope Brand
          // Also removed hardcoded 'rotate-[180deg]' since the CSS module handles rotation
          "absolute z-[40] h-[0.1rem] w-[0.1rem] rounded-[9999px] bg-[#00c2cb] shadow-[0_0_0_1px_#ffffff10]",
          styles.meteor,
          className
        )}
      ></span>
    )
  );
};

export default Beam;