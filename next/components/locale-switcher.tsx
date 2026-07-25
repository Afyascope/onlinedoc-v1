"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSlugContext } from "@/app/context/SlugContext";
import { cn } from "@/lib/utils";

const SUPPORTED_LOCALES = ["en", "sw"];

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  // -----------------------------------------------------------------
  // TEMPORARY OVERRIDE: Disable Switcher
  // -----------------------------------------------------------------
  return null; 

  // -----------------------------------------------------------------
  //  Everything below is saved for when you are ready to launch Swahili
  // -----------------------------------------------------------------
  /*
  const { state } = useSlugContext();
  const { localizedSlugs } = state;

  const pathname = usePathname();
  const segments = pathname.split("/");

  const generateLocalizedPath = (targetLocale: string): string => {
    if (!pathname) return `/${targetLocale}`;

    if (segments.length <= 2) {
      return `/${targetLocale}`;
    }

    if (localizedSlugs && localizedSlugs[targetLocale]) {
      const newSegments = [...segments];
      newSegments[1] = targetLocale;
      newSegments[newSegments.length - 1] = localizedSlugs[targetLocale];
      return newSegments.join("/");
    }

    const fallbackSegments = [...segments];
    fallbackSegments[1] = targetLocale;
    return fallbackSegments.join("/");
  };

  return (
    <div className="flex gap-2 p-1 rounded-md bg-[#001f3f]/50 border border-white/10">
      {!pathname.includes("/products/") &&
        SUPPORTED_LOCALES.map((locale) => (
          <Link key={locale} href={generateLocalizedPath(locale)}>
            <div
              className={cn(
                "flex cursor-pointer items-center justify-center text-xs font-bold uppercase w-8 py-1 rounded-md transition duration-200",
                "text-white/70 hover:text-white hover:bg-white/10",
                locale === currentLocale
                  ? "bg-[#00c2cb] text-[#001f3f] shadow-sm"
                  : ""
              )}
            >
              {locale}
            </div>
          </Link>
        ))}
    </div>
  );
  */
}