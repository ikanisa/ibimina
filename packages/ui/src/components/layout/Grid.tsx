"use client";

import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface GridProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12 | "auto";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 6 | 12;
    md?: 1 | 2 | 3 | 4 | 6 | 12;
    lg?: 1 | 2 | 3 | 4 | 6 | 12;
    xl?: 1 | 2 | 3 | 4 | 6 | 12;
  };
  fullWidth?: boolean;
}

const GAPS = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
  "2xl": "gap-12",
} as const;

const COLS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
  12: "grid-cols-12",
  auto: "grid-cols-[repeat(auto-fit,minmax(250px,1fr))]",
} as const;

const RESPONSIVE_COLS = {
  sm: {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
    6: "sm:grid-cols-6",
    12: "sm:grid-cols-12",
  },
  md: {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    6: "md:grid-cols-6",
    12: "md:grid-cols-12",
  },
  lg: {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    6: "lg:grid-cols-6",
    12: "lg:grid-cols-12",
  },
  xl: {
    1: "xl:grid-cols-1",
    2: "xl:grid-cols-2",
    3: "xl:grid-cols-3",
    4: "xl:grid-cols-4",
    6: "xl:grid-cols-6",
    12: "xl:grid-cols-12",
  },
} as const;

/**
 * Grid Component - CSS Grid Layout Primitive
 *
 * A responsive grid container that adapts to different screen sizes.
 * Supports 1-12 column layouts and automatic responsive behavior.
 *
 * @example
 * ```tsx
 * <Grid cols={4} gap="md" responsive={{ sm: 1, md: 2, lg: 4 }}>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 *   <Card>Item 4</Card>
 * </Grid>
 * ```
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  {
    children,
    cols = 1,
    gap = "md",
    responsive,
    fullWidth = false,
    className,
    ...props
  },
  ref
) {
  const responsiveClasses = responsive
    ? Object.entries(responsive)
        .map(([breakpoint, colCount]) => {
          const bp = breakpoint as keyof typeof RESPONSIVE_COLS;
          return RESPONSIVE_COLS[bp][colCount];
        })
        .join(" ")
    : "";

  return (
    <div
      ref={ref}
      className={cn(
        "grid",
        COLS[cols],
        GAPS[gap],
        responsiveClasses,
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
