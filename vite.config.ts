import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const iconDataUri =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2064%2064%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27rw%27%20x1%3D%270%25%27%20y1%3D%270%25%27%20x2%3D%27100%25%27%20y2%3D%27100%25%27%3E%3Cstop%20offset%3D%270%25%27%20stop-color%3D%27%2300A1DE%27/%3E%3Cstop%20offset%3D%2750%25%27%20stop-color%3D%27%23FAD201%27/%3E%3Cstop%20offset%3D%27100%25%27%20stop-color%3D%27%2320603D%27/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width%3D%2764%27%20height%3D%2764%27%20rx%3D%2712%27%20fill%3D%27url%28%23rw%29%27/%3E%3Cpath%20d%3D%27M18%2036l8%208%2020-20%27%20stroke%3D%27%230B1020%27%20stroke-width%3D%274%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20fill%3D%27none%27/%3E%3C/svg%3E";

const manifest = {
  name: "Umurenge SACCO — Ibimina",
  short_name: "Ibimina Staff",
  description: "Staff-only PWA for Umurenge SACCO ibimina onboarding, deposits, reconciliation, and reporting.",
  theme_color: "#00A1DE",
  background_color: "#0B1020",
  display: "standalone",
  start_url: "/",
  icons: [
    {
      src: iconDataUri,
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any",
    },
    {
      src: iconDataUri,
      sizes: "any",
      type: "image/svg+xml",
      purpose: "maskable",
    },
  ],
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      manifest,
      includeAssets: ["robots.txt"],
      devOptions: {
        enabled: true,
      },
    }),
  ];

  if (mode === "development") {
    plugins.push(componentTagger());
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
