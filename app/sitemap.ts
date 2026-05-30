import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://estaila.com";

// Regenerate hourly (ISR) — runs at request time with DB access.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/welcome`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/legal/reembolsos`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const [sites, props, cards] = await Promise.all([
      prisma.site.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.property.findMany({
        where: { publicEnabled: true, slug: { not: null } },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.digitalCard.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
    ]);
    dynamicRoutes = [
      ...sites.map((s) => ({
        url: `${BASE}/p/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...props.map((p) => ({
        url: `${BASE}/propiedad/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...cards.map((c) => ({
        url: `${BASE}/c/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    ];
  } catch {
    // DB unavailable (e.g. build step) — fall back to static routes only.
  }

  return [...staticRoutes, ...dynamicRoutes];
}
