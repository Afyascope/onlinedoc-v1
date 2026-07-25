"use client";
import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image"; // Import ImageProps for better typing
import React, { useState } from "react";

export const BlurImage = ({
  height,
  width,
  src,
  className,
  alt,
  ...rest
}: ImageProps) => {
  const [isLoading, setLoading] = useState(true);

  return (
    <Image
      className={cn(
        "transition duration-300",
        // When loading: blur and slightly scale down (optional, looks smoother)
        // When loaded: remove blur
        isLoading ? "blur-sm scale-105" : "blur-0 scale-100",
        className
      )}
      onLoad={() => setLoading(false)}
      src={src}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      // Remove blurDataURL unless you have a specific base64 string
      alt={alt || "Background of a beautiful view"}
      {...rest}
    />
  );
};