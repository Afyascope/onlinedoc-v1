import { cn } from "@/lib/utils";
import React from "react";

export const Container = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        // Base: Max width 7xl (approx 1280px) and centered
        "max-w-7xl mx-auto",
        // Padding: Increased mobile padding (px-5) for better touch targets
        // Responsive: md:px-10 is great for tablets
        "px-5 md:px-10 xl:px-8",
        className
      )}
    >
      {children}
    </div>
  );
};