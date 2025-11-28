"use client";

import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface StackProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode;
  direction?: "vertical" | "horizontal";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
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

const ALIGN = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const;

const JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
} as const;

/**
 * Stack Component - Flexbox Layout Primitive
 *
 * A flexible container that arranges children in a vertical or horizontal stack.
 * Provides consistent spacing and alignment across the application.
 *
 * @example
 * ```tsx
 * <Stack direction="vertical" gap="md" align="center">
 *   <Button>First</Button>
 *   <Button>Second</Button>
 * </Stack>
 * ```
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  {
    children,
    direction = "vertical",
    gap = "md",
    align = "stretch",
    justify = "start",
    wrap = false,
    fullWidth = false,
    className,
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex",
        direction === "vertical" ? "flex-col" : "flex-row",
        GAPS[gap],
        ALIGN[align],
        JUSTIFY[justify],
        wrap && "flex-wrap",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
