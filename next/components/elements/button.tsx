import { cn } from "@/lib/utils";
import React from "react";
import { LinkProps } from "next/link"; 

interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: "simple" | "outline" | "primary" | "muted";
  as?: any;
  className?: string;
  children?: React.ReactNode;
  href?: LinkProps["href"];
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  as: Tag = "button",
  className,
  children,
  ...props
}) => {
  
  const variants = {
    simple: "bg-transparent text-primary hover:text-brand border-none shadow-none hover:bg-[#E0FCFF] px-0 md:px-4",

    primary: "bg-brand text-white border border-brand hover:bg-brand-hover shadow-[0px_4px_10px_rgba(44,177,188,0.3)] hover:-translate-y-0.5",

    outline: "bg-white border border-border text-primary hover:bg-[#E0FCFF] hover:border-brand",

    muted: "bg-neutral-100 border border-transparent text-neutral-600 hover:bg-neutral-200 hover:text-primary",
  };

  return (
    <Tag
      className={cn(
        "relative z-10 text-sm md:text-sm font-bold rounded-xl px-6 py-3 flex items-center justify-center transition-all duration-200 cursor-pointer",
        variants[variant] || variants.primary,
        className
      )}
      {...props}
    >
      {children ?? `Get Started`}
    </Tag>
  );
};
