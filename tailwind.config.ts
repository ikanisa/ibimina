import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B1020",
        foreground: "var(--fg)",
        background: "var(--bg)",
        neutral: {
          0: "var(--neutral-0)",
          1: "var(--neutral-1)",
          2: "var(--neutral-2)",
          9: "var(--neutral-9)",
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
      },
      borderRadius: {
        xl: "16px",
        "2xl": "28px",
      },
      boxShadow: {
        glass: "0 8px 24px rgba(0, 0, 0, 0.25)",
        subtle: "0 2px 10px rgba(0, 0, 0, 0.35)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        md: ["1.125rem", { lineHeight: "1.6rem" }],
        lg: ["1.25rem", { lineHeight: "1.75rem" }],
        xl: ["1.5rem", { lineHeight: "1.9rem" }],
        "2xl": ["1.75rem", { lineHeight: "2.1rem" }],
        "3xl": ["2.125rem", { lineHeight: "2.5rem" }],
      },
      spacing: {
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
      },
      transitionDuration: {
        interactive: "200ms",
      },
      transitionTimingFunction: {
        interactive: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200px 0" },
          "100%": { backgroundPosition: "200px 0" },
        },
        pulseFade: {
          "0%, 100%": { opacity: 0.6 },
          "50%": { opacity: 1 },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite linear",
        pulseFade: "pulseFade 2.2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
