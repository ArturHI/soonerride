import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SoonerRide",
    short_name: "SoonerRide",
    description: "Carpool with verified OU students going your way.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f1ea",
    theme_color: "#f5f1ea",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
