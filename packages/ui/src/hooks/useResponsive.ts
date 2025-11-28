"use client";

import { useState, useEffect } from "react";

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const breakpoints: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export interface UseResponsiveReturn {
  breakpoint: Breakpoint;
  dimensions: { width: number; height: number };
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  width: number;
  height: number;
}

/**
 * useResponsive Hook
 *
 * Detects current screen size and provides responsive utilities.
 * Updates on window resize with debouncing for performance.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, breakpoint, width } = useResponsive();
 *   
 *   return (
 *     <div>
 *       {isMobile ? <MobileNav /> : <DesktopNav />}
 *       <p>Current breakpoint: {breakpoint}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useResponsive(): UseResponsiveReturn {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("lg");
  const [dimensions, setDimensions] = useState({ width: 1024, height: 768 });

  useEffect(() => {
    // Initialize on client side
    function updateDimensions() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setDimensions({ width, height });

      // Determine breakpoint
      if (width >= breakpoints["2xl"]) {
        setBreakpoint("2xl");
      } else if (width >= breakpoints.xl) {
        setBreakpoint("xl");
      } else if (width >= breakpoints.lg) {
        setBreakpoint("lg");
      } else if (width >= breakpoints.md) {
        setBreakpoint("md");
      } else if (width >= breakpoints.sm) {
        setBreakpoint("sm");
      } else {
        setBreakpoint("xs");
      }
    }

    // Initial update
    updateDimensions();

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    function handleResize() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 150);
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const isMobile = breakpoint === "xs" || breakpoint === "sm";
  const isTablet = breakpoint === "md";
  const isDesktop = breakpoint === "lg" || breakpoint === "xl" || breakpoint === "2xl";
  const isTouch = typeof window !== "undefined" && "ontouchstart" in window;

  return {
    breakpoint,
    dimensions,
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    width: dimensions.width,
    height: dimensions.height,
  };
}
