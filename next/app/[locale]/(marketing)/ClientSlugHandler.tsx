"use client";

import { useEffect } from "react";
import { useSlugContext } from "@/app/context/SlugContext";
import { usePathname, useRouter } from "next/navigation";
import { publicLocaleFor } from "@/i18n.config";

export default function ClientSlugHandler({
  localizedSlugs,
}: {
  localizedSlugs: Record<string, string>;
}) {
  const { dispatch } = useSlugContext();
  const pathname = usePathname();

  useEffect(() => {
    if (localizedSlugs && pathname) {
      const publicSlugs = Object.entries(localizedSlugs).reduce<Record<string, string>>(
        (acc, [locale, slug]) => {
          const publicLocale = publicLocaleFor(locale);
          if (publicLocale) acc[publicLocale] = slug;
          acc[locale] = slug;
          return acc;
        },
        {}
      );
      dispatch({ type: "SET_SLUGS", payload: publicSlugs, path: pathname });
    }
  }, [localizedSlugs, pathname, dispatch]);

  const router = useRouter();

  useEffect(() => {
    const handleMessage = async (message: MessageEvent<any>) => {
      if (
        message.origin === process.env.NEXT_PUBLIC_API_URL &&
        message.data.type === "strapiUpdate"
      ) {
        router.refresh();
      }
    };

    // Add the event listener
    window.addEventListener("message", handleMessage);

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [router]);

  return null; // This component only handles the state and doesn't render anything.
}
