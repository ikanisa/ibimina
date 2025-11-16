import type { Config } from "tailwindcss";
import tokens from "@ibimina/ui/tokens.json" assert { type: "json" };

/**
 * Tailwind CSS configuration for SACCO+ Client App
 *
 * Atlas UI Design System (WCAG 2.2 AA Compliant):
 * - Neutral-first color palette with strategic brand accents
 * - 8pt spacing grid for consistency
 * - Systematic typography scale
 * - Accessibility-focused (proper contrast, focus states)
 * - Reduced motion support
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    screens: tokens.screens,
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.fontFamily,
      fontSize: tokens.fontSize,
      spacing: tokens.spacing,
      boxShadow: tokens.boxShadow,
      borderRadius: tokens.borderRadius,
      animation: tokens.animation,
      keyframes: tokens.keyframes,
      transitionDuration: tokens.transitionDuration,
    },
  },
  plugins: [],
};

export default config;
