"use client";

import { useEffect, useState } from "react";

export interface ResponsiveState {
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isXLDesktop: boolean;
  isMobile: boolean;
  isTablet: boolean;
}

const BREAKPOINT_FALLBACKS = {
  tablet: 768,
  desktop: 960,
  largeDesktop: 1200,
  xlDesktop: 1440,
} as const;

function resolveBreakpoint(token: string, fallback: number): number {
  if (typeof window === "undefined") {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (!value) {
    return fallback;
  }
  const numeric = Number.parseInt(value.replace("px", ""), 10);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => ({
    isDesktop: false,
    isLargeDesktop: false,
    isXLDesktop: false,
    isTablet: false,
    isMobile: true,
  }));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const breakpoints = {
      tablet: resolveBreakpoint("--breakpoint-md", BREAKPOINT_FALLBACKS.tablet),
      desktop: resolveBreakpoint("--breakpoint-lg", BREAKPOINT_FALLBACKS.desktop),
      largeDesktop: resolveBreakpoint("--breakpoint-xl", BREAKPOINT_FALLBACKS.largeDesktop),
      xlDesktop: resolveBreakpoint("--breakpoint-2xl", BREAKPOINT_FALLBACKS.xlDesktop),
    };

    const tabletMinQuery = window.matchMedia(`(min-width: ${breakpoints.tablet}px)`);
    const desktopQuery = window.matchMedia(`(min-width: ${breakpoints.desktop}px)`);
    const largeDesktopQuery = window.matchMedia(`(min-width: ${breakpoints.largeDesktop}px)`);
    const xlDesktopQuery = window.matchMedia(`(min-width: ${breakpoints.xlDesktop}px)`);

    const update = () => {
      setState({
        isDesktop: desktopQuery.matches,
        isLargeDesktop: largeDesktopQuery.matches,
        isXLDesktop: xlDesktopQuery.matches,
        isTablet: !desktopQuery.matches && tabletMinQuery.matches,
        isMobile: !tabletMinQuery.matches,
      });
    };

    update();

    desktopQuery.addEventListener("change", update);
    largeDesktopQuery.addEventListener("change", update);
    xlDesktopQuery.addEventListener("change", update);
    tabletMinQuery.addEventListener("change", update);

    return () => {
      desktopQuery.removeEventListener("change", update);
      largeDesktopQuery.removeEventListener("change", update);
      xlDesktopQuery.removeEventListener("change", update);
      tabletMinQuery.removeEventListener("change", update);
    };
  }, []);

  return state;
}
