/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
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
      },
      backgroundImage: {
        // Rwanda gradient (horizontal sweep)
        kigali: "linear-gradient(135deg, #00A1DE 0%, #FAD201 50%, #20603D 100%)",
        // Radial Rwanda gradient (sunset effect)
        nyungwe: "radial-gradient(ellipse at 20% 10%, rgba(0, 161, 222, 0.5), rgba(250, 210, 1, 0.4), rgba(32, 96, 61, 0.5))",
        // Dark gradient base
        "dark-base": "linear-gradient(180deg, #050712 0%, #0b122c 100%)",
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
        mono: ["monospace"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px", letterSpacing: "0.01em" }],
        sm: ["14px", { lineHeight: "20px", letterSpacing: "0.01em" }],
        base: ["16px", { lineHeight: "24px", letterSpacing: "0" }],
        lg: ["18px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
        xl: ["20px", { lineHeight: "30px", letterSpacing: "-0.01em" }],
        "2xl": ["24px", { lineHeight: "32px", letterSpacing: "-0.02em" }],
        "3xl": ["30px", { lineHeight: "38px", letterSpacing: "-0.02em" }],
        "4xl": ["36px", { lineHeight: "44px", letterSpacing: "-0.03em" }],
        "5xl": ["48px", { lineHeight: "56px", letterSpacing: "-0.03em" }],
      },
      spacing: {
        18: "72px",
        88: "352px",
        128: "512px",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        // Elevation system for cards
        elevation1: "0 1px 3px rgba(0, 0, 0, 0.12)",
        elevation2: "0 2px 6px rgba(0, 0, 0, 0.16)",
        elevation3: "0 4px 12px rgba(0, 0, 0, 0.20)",
        elevation4: "0 8px 24px rgba(0, 0, 0, 0.24)",
        elevation5: "0 16px 48px rgba(0, 0, 0, 0.28)",
        // Glassmorphism
        glass: "0 8px 32px rgba(0, 0, 0, 0.18)",
      },
    },
  },
  plugins: [],
};
