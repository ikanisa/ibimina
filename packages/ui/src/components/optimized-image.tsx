"use client";

import Image, { type ImageProps } from "next/image";

import { getBlurDataURL } from "../utils/blur-placeholder";
import { designTokens } from "../theme/design-tokens";

export interface OptimizedImageProps extends Omit<ImageProps, "placeholder"> {
  withPlaceholder?: boolean;
  accentColor?: string;
}

export function OptimizedImage({
  withPlaceholder = true,
  accentColor = designTokens.colors.brand.primary,
  blurDataURL,
  loading,
  priority,
  alt,
  ...props
}: OptimizedImageProps) {
  const resolvedBlur = withPlaceholder
    ? (blurDataURL ??
      getBlurDataURL({
        width: typeof props.width === "number" ? props.width : undefined,
        height: typeof props.height === "number" ? props.height : undefined,
        accent: accentColor,
      }))
    : undefined;

  return (
    <Image
      {...props}
      alt={alt}
      priority={priority}
      loading={priority ? loading : (loading ?? "lazy")}
      placeholder={resolvedBlur ? "blur" : undefined}
      blurDataURL={resolvedBlur}
    />
  );
}
