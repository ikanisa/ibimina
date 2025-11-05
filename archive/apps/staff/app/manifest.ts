import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ibimina Staff Portal",
    short_name: "Ibimina",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#0b1020",
    description: "Installable PWA for SACCO+ staff to manage ibimina operations online or offline.",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "View ibimina KPIs",
        url: "/dashboard",
        icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Tasks",
        short_name: "Tasks",
        description: "Open outstanding field tasks",
        url: "/dashboard/tasks",
        icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
  };
}
