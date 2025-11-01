import type { Config } from "tailwindcss";

/**
 * Tailwind CSS configuration for SACCO+ Admin App
 *
 * Atlas-inspired design system:
 * - Professional, clean interface
 * - Modern color palette optimized for data-heavy interfaces
 * - Smooth animations and transitions
 * - ChatGPT Atlas aesthetic
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./providers/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1020",
        foreground: "var(--fg)",
        background: "var(--bg)",
        atlas: {
          blue: "#0066FF",
          "blue-light": "#3385FF",
          "blue-dark": "#0052CC",
          glow: "rgba(0, 102, 255, 0.15)",
        },
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
        rw: {
          blue: "#00A1DE",
          yellow: "#FAD201",
          green: "#20603D",
        },
      },
      backgroundImage: {
        kigali: "linear-gradient(135deg, var(--rw-blue), var(--rw-yellow) 50%, var(--rw-green))",
        nyungwe:
          "radial-gradient(1200px 800px at 20% 10%, rgba(0, 161, 222, 0.45), rgba(250, 210, 1, 0.35), rgba(32, 96, 61, 0.45))",
        "atlas-glow": "radial-gradient(circle at 50% 0%, rgba(0, 102, 255, 0.06), transparent 50%)",
        "atlas-gradient": "linear-gradient(135deg, #0066FF 0%, #3385FF 100%)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        glass: "0 8px 24px rgba(0, 0, 0, 0.12)",
        subtle: "0 2px 8px rgba(0, 0, 0, 0.08)",
        atlas: "0 4px 16px rgba(0, 102, 255, 0.12)",
        "atlas-lg": "0 8px 32px rgba(0, 102, 255, 0.16)",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: ["'SF Mono'", "Monaco", "Consolas", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.125rem", letterSpacing: "0.01em" }],
        sm: ["0.875rem", { lineHeight: "1.375rem", letterSpacing: "0.01em" }],
        base: ["1rem", { lineHeight: "1.5rem", letterSpacing: "0" }],
        lg: ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        xl: ["1.25rem", { lineHeight: "1.875rem", letterSpacing: "-0.01em" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.02em" }],
        "3xl": ["1.875rem", { lineHeight: "2.375rem", letterSpacing: "-0.02em" }],
        "4xl": ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "-0.03em" }],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      transitionDuration: {
        interactive: "150ms",
        smooth: "300ms",
      },
      transitionTimingFunction: {
        interactive: "cubic-bezier(0.4, 0, 0.2, 1)",
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200px 0" },
          "100%": { backgroundPosition: "200px 0" },
        },
        pulseFade: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 102, 255, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(0, 102, 255, 0.5)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite linear",
        pulseFade: "pulseFade 2.2s infinite ease-in-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        glow: "glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
