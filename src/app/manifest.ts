import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flouwell",
    short_name: "Flouwell",
    description: "Ruang aman buat melampiaskan beban, tanpa dihakimi.",
    start_url: "/feed",
    display: "standalone",
    background_color: "#EFF8FF",
    theme_color: "#0EA5E9",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
