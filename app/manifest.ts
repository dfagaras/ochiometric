import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ochiometric — Estimări zilnice",
    short_name: "Ochiometric",
    description: "Trei întrebări zilnice. Fără Google. Doar estimări.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f1e9",
    theme_color: "#17264a",
    lang: "ro",
    categories: ["games", "education"],
    icons: [
      { src: "/ochiometric-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/ochiometric-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
