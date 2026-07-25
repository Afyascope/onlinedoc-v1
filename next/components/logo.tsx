import React from "react";

import { Link } from "next-view-transitions";
import { BlurImage } from "./blur-image";

import { strapiImage } from "@/lib/strapi/strapiImage";
import { Image } from "@/types/types";

export const Logo = ({ image, locale }: { image?: Image, locale?: string }) => {
  if (image) {
    return (
      <Link
        href={`/${locale || 'en'}`}
        className="font-normal flex space-x-1 md:space-x-2 items-center text-sm mr-4 text-black relative z-20"
      >
        <BlurImage
          src={strapiImage(image?.url)}
          alt={image.alternativeText}
          width={200}
          height={200}
          className="h-9 w-9 rounded-xl"
        />
        
  {/* Brand text: responsive sizing so the logo matches navbar items */}
  <span className="font-bold text-base md:text-lg lg:text-xl leading-none"><span className="text-white">Afya</span><span className="text-secondary">scope</span></span>
      </Link>
    );
  }

  return;
};
