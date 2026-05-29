import type { MetadataRoute } from "next";

/**
 * PWA manifest — hace estaila instalable como app en Android/iOS.
 * Next App Router lo sirve en /manifest.webmanifest automáticamente.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "estaila — CRM + Studio IA",
    short_name: "estaila",
    description:
      "CRM inmobiliario con Studio de IA para agentes: staging, marketing y gestión desde el teléfono.",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0a0a0a",
    theme_color: "#00bf63",
    lang: "es",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/logos/iso-estaila.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/iso-estaila.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/iso-estaila.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
