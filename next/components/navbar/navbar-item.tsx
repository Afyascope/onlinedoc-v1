"use client";

import { cn } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = {
  href: string; // FIXED: Changed from 'never' to 'string'
  children: ReactNode;
  active?: boolean;
  className?: string;
  target?: string;
};

export function NavbarItem({
  children,
  href,
  active,
  target,
  className,
}: Props) {
  const pathname = usePathname();

  // Better Active Logic:
  // 1. If explicitly set to 'active' prop = true
  // 2. OR if current path includes this link (e.g. /blog/post-1 includes /blog)
  // 3. BUT handle the Home '/' case so it doesn't stay active on every page.
  const isHome = href === "/";
  const isActive = active || (isHome ? pathname === href : pathname?.includes(href));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-center text-sm font-medium leading-[110%] px-4 py-2 rounded-full transition duration-200",
        /* Default State */
        "text-neutral-300 hover:text-white hover:bg-white/10",
        
        /* Active State (Keeps the button 'lit' when you are on that page) */
        isActive && "bg-white/10 text-white shadow-[0px_1px_0px_0px_rgba(255,255,255,0.1)_inset]",
        
        className
      )}
      target={target}
    >
      {children}
    </Link>
  );
}