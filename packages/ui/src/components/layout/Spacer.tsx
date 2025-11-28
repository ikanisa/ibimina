"use client";

import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export interface SpacerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  direction?: "vertical" | "horizontal";
}

const VERTICAL_SIZES = {
  xs: "h-1",
  sm: "h-2",
  md: "h-4",
  lg: "h-6",
  xl: "h-8",
  "2xl": "h-12",
} as const;

const HORIZONTAL_SIZES = {
  xs: "w-1",
  sm: "w-2",
  md: "w-4",
  lg: "w-6",
  xl: "w-8",
  "2xl": "w-12",
} as const;

/**
 * Spacer Component - Visual Spacing Utility
 *
 * Adds consistent vertical or horizontal space between elements.
 * Useful for fine-tuning layouts without adding margin/padding.
 *
 * @example
 * ```tsx
 * <div>
 *   <h1>Title</h1>
 *   <Spacer size="md" />
 *   <p>Content</p>
 * </div>
 * ```
 */
export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(function Spacer(
  { size = "md", direction = "vertical", className, ...props },
  ref
) {
  const sizeClasses = direction === "vertical" ? VERTICAL_SIZES[size] : HORIZONTAL_SIZES[size];

  return (
    <div
      ref={ref}
      className={cn(sizeClasses, className)}
      aria-hidden="true"
      {...props}
    />
  );
});
