import { cn } from "@/lib/utils";
import { AnimationProps, MotionProps } from "framer-motion";
import React from "react";
import Balancer from "react-wrap-balancer";

export const Subheading = ({
  className,
  as: Tag = "h2",
  children,
  ...props
}: {
  className?: string;
  as?: any;
  children: any;
  props?: React.HTMLAttributes<HTMLHeadingElement | AnimationProps>;
} & MotionProps &
  React.HTMLAttributes<HTMLHeadingElement | AnimationProps>) => {
  return (
    <Tag
      className={cn(
        // FIX 1: Increased text size for better readability (text-base instead of text-sm)
        "text-base md:text-lg max-w-4xl text-left my-4 mx-auto",
        // FIX 2: Removed 'text-muted' and added 'text-neutral-200' (High contrast for dark mode)
        "text-neutral-200 text-center font-normal",
        className
      )}
    >
      <Balancer>{children}</Balancer>
    </Tag>
  );
};