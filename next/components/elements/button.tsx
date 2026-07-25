import { cn } from "@/lib/utils";
import React from "react";
import { LinkProps } from "next/link"; 

interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: "simple" | "outline" | "primary" | "muted";
  as?: any; // Changed to any to accept Link component easily
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
    // 1. SIMPLE: The one you want. No background, Cyan Text. 
    // Removed 'text-secondary' (Red) and replaced with 'text-cyan-400'.
    simple: "bg-transparent text-cyan-400 hover:text-cyan-300 border-none shadow-none hover:bg-cyan-950/30 px-0 md:px-4",

    // 2. PRIMARY: Updated to White/Black (AfyaScope Brand)
    // Removed 'bg-secondary' (Red).
    primary: "bg-white text-black border border-white hover:bg-neutral-200 shadow-[0px_4px_10px_rgba(0,0,0,0.2)] hover:-translate-y-0.5",

    // 3. OUTLINE: Glassy look
    outline: "bg-transparent border border-white/20 text-white hover:bg-white hover:text-black hover:border-white",

    // 4. MUTED: Dark Grey for secondary actions
    muted: "bg-neutral-800 border border-transparent text-neutral-300 hover:bg-neutral-700 hover:text-white",
  };

  return (
    <Tag
      className={cn(
        // Base Styles (Rounded-xl looks more modern than rounded-md)
        "relative z-10 text-sm md:text-sm font-bold rounded-xl px-6 py-3 flex items-center justify-center transition-all duration-200 cursor-pointer",
        variants[variant] || variants.primary, // Fallback to primary if variant is typo'd
        className
      )}
      {...props}
    >
      {children ?? `Get Started`}
    </Tag>
  );
};