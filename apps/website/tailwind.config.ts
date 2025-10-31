import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rwblue: "#00A1DE",
        rwroyal: "#0033FF",
        rwyellow: "#FAD201",
        rwgreen: "#20603D",
        ink: "#0B1020",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        bold: ["Poppins", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 18px 60px rgba(0,0,0,.25)",
      },
      borderRadius: {
        glass: "24px",
      },
    },
  },
  plugins: [],
} satisfies Config;
