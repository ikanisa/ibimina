import type { Config } from "tailwindcss";
import tokens from "@ibimina/ui/tokens.json" assert { type: "json" };

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
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
} satisfies Config;
