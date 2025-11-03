/**
 * Rwanda-inspired color palette
 * Based on the national flag colors with warm accent extensions
 */

export const colors = {
  // Rwanda national colors
  rw: {
    blue: "#00A1DE",
    yellow: "#FAD201",
    green: "#20603D",
  },

  // Warm accent palette
  warm: {
    50: "#FFF9F5",
    100: "#FFF1E8",
    200: "#FFE3D1",
    300: "#FFCFAD",
    400: "#FFB380",
    500: "#FF9152",
    600: "#F77033",
    700: "#E55A1F",
    800: "#C24811",
    900: "#9A3A0D",
  },

  // Dark gradient base
  ink: {
    50: "#E8EAF0",
    100: "#CDD1E0",
    200: "#9BA3C1",
    300: "#6976A3",
    400: "#4A5888",
    500: "#2E3B6E",
    600: "#1F2954",
    700: "#151C3D",
    800: "#0D1127",
    900: "#050712",
    950: "#020308",
  },

  // Neutral grays
  neutral: {
    0: "#FFFFFF",
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
    950: "#030712",
  },
};

export const gradients = {
  // Rwanda flag horizontal sweep
  kigali: ["#00A1DE", "#FAD201", "#20603D"],
  kigaliAngle: 135,

  // Radial sunset effect
  nyungwe: ["rgba(0, 161, 222, 0.5)", "rgba(250, 210, 1, 0.4)", "rgba(32, 96, 61, 0.5)"],

  // Dark base for screens
  darkBase: ["#050712", "#0b122c"],
  darkBaseAngle: 180,

  // Warm accent gradient
  warmGlow: ["#FF9152", "#F77033"],
  warmGlowAngle: 135,
};
