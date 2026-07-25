"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";

const meteorKeyframes = `
@keyframes meteor {
  0% { left: 0; opacity: 0; }
  70% { opacity: 1; }
  100% { left: 100%; opacity: 0; }
}
.meteor-beam {
  transform: rotate(-180deg);
  animation: meteor 3s linear;
  animation-delay: var(--meteor-delay, 0s);
  animation-duration: var(--meteor-duration, 2s);
}
.meteor-beam::before {
  content: "";
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: var(--meteor-width, 50px);
  height: 1px;
  background: linear-gradient(90deg, #2CB1BC, rgba(255, 255, 255, 0.4), transparent);
}
`;

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
    <>
      <style>{meteorKeyframes}</style>
      {showBeam && (
        <span
          ref={meteorRef}
          className={cn(
            "absolute z-[40] h-[0.1rem] w-[0.1rem] rounded-[9999px] bg-brand shadow-[0_0_0_1px_#ffffff10]",
            "meteor-beam",
            className
          )}
        ></span>
      )}
    </>
  );
};

export default Beam;
