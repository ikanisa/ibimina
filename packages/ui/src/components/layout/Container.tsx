"use client";

import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface ContainerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
  centerContent?: boolean;
}

const SIZES = {
  sm: "max-w-2xl", // 672px
  md: "max-w-4xl", // 896px
  lg: "max-w-6xl", // 1152px
  xl: "max-w-7xl", // 1280px
  full: "max-w-full",
} as const;

const PADDINGS = {
  none: "",
  sm: "px-4 py-4",
  md: "px-6 py-6",
  lg: "px-8 py-8",
} as const;

/**
 * Container Component - Max-Width Content Wrapper
 *
 * Centers content and constrains maximum width for optimal readability.
 * Provides consistent padding across different screen sizes.
 *
 * @example
 * ```tsx
 * <Container size="lg" padding="md">
 *   <h1>Page Title</h1>
 *   <p>Content goes here...</p>
 * </Container>
 * ```
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  {
    children,
    size = "lg",
    padding = "md",
    centerContent = false,
    className,
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "mx-auto w-full",
        SIZES[size],
        PADDINGS[padding],
        centerContent && "flex flex-col items-center justify-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
