import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://estaila.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Áreas privadas / de app — requieren auth y no aportan a SEO
      disallow: [
        "/api/",
        "/admin",
        "/settings",
        "/onboarding",
        "/inicio",
        "/r/", // tracking redirects
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
