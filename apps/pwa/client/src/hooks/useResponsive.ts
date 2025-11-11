"use client";

import { useEffect, useState } from "react";

export interface ResponsiveState {
  isDesktop: boolean;
  isMobile: boolean;
  isTablet: boolean;
}

const DESKTOP_BREAKPOINT = 1024;
const TABLET_BREAKPOINT = 768;

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => ({
    isDesktop: false,
    isTablet: false,
    isMobile: true,
  }));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const desktopQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const tabletQuery = window.matchMedia(
      `(min-width: ${TABLET_BREAKPOINT}px) and (max-width: ${DESKTOP_BREAKPOINT - 1}px)`
    );

    const update = () => {
      setState({
        isDesktop: desktopQuery.matches,
        isTablet: tabletQuery.matches,
        isMobile: !desktopQuery.matches,
      });
    };

    update();

    desktopQuery.addEventListener("change", update);
    tabletQuery.addEventListener("change", update);

    return () => {
      desktopQuery.removeEventListener("change", update);
      tabletQuery.removeEventListener("change", update);
    };
  }, []);

  return state;
}
