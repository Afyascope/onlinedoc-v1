"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSlugContext } from "@/app/context/SlugContext";
import { cn } from "@/lib/utils";
import { i18n, strapiLocaleFor } from "@/i18n.config";

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const { state } = useSlugContext();

  const pathname = usePathname();
  const localizedSlugs =
    state.localizedSlugPath === pathname ? state.localizedSlugs : {};
  const segments = pathname?.split("/") ?? [];

  const generateLocalizedPath = (targetLocale: (typeof i18n.locales)[number]): string | null => {
    if (!pathname || segments.length <= 1) return `/${targetLocale}`;

    const localizedSlug = localizedSlugs[strapiLocaleFor(targetLocale)];
    if (localizedSlug !== undefined) {
      if (localizedSlug === "" && segments.length <= 2) {
        return `/${targetLocale}`;
      }

      const newSegments = [...segments];
      newSegments[1] = targetLocale;
      newSegments[newSegments.length - 1] = localizedSlug;
      return newSegments.join("/");
    }

    return null;
  };

  return (
    <div className="flex gap-2 p-1 rounded-md bg-[#001f3f]/50 border border-white/10">
      {!pathname.includes("/products/") && i18n.locales.map((locale) => {
        const href = locale === currentLocale ? pathname : generateLocalizedPath(locale);
        const className = cn(
          "flex items-center justify-center text-xs font-bold uppercase w-8 py-1 rounded-md transition duration-200",
          href ? "cursor-pointer text-white/70 hover:text-white hover:bg-white/10" : "cursor-not-allowed text-white/30",
          locale === currentLocale ? "bg-[#00c2cb] text-[#001f3f] shadow-sm" : ""
        );

        return href ? (
          <Link key={locale} href={href}>
            <span className={className}>{locale}</span>
          </Link>
        ) : (
          <span key={locale} className={className} aria-disabled="true">
            {locale}
          </span>
        );
      })}
    </div>
  );
}