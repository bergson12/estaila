import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CinematicShowcase } from "@/components/portal/cinematic-showcase";
import { CinematicCrm } from "@/components/portal/cinematic-crm";
import { PortalMobileProperty } from "@/components/portal/mobile/portal-mobile-property";
import { getActiveOrgBranding } from "@/lib/org-branding";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

async function fetchData(slug: string, propertyId: string) {
  const site = await prisma.site.findUnique({
    where: { slug },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!site || !site.published) return null;

  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: site.userId },
    include: {
      photos: { orderBy: { order: "asc" } },
      pois: { orderBy: [{ pinned: "desc" }, { order: "asc" }] },
    },
  });
  if (!property) return null;

  return { site, agent: site.user, property };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; propertyId: string }>;
}): Promise<Metadata> {
  const { slug, propertyId } = await params;
  const data = await fetchData(slug, propertyId);
  if (!data) return { title: "Propiedad no encontrada" };

  return {
    title: `${data.property.title} — ${data.site.title ?? data.agent.name}`,
    description:
      data.property.description ??
      `${data.property.title}${data.property.location ? ` en ${data.property.location}` : ""}`,
    openGraph: {
      title: data.property.title,
      description: data.property.description ?? undefined,
      images: data.property.featuredPhoto
        ? [{ url: data.property.featuredPhoto }]
        : undefined,
    },
  };
}

export default async function PortalPropertyPage({
  params,
}: {
  params: Promise<{ slug: string; propertyId: string }>;
}) {
  const { slug, propertyId } = await params;
  const data = await fetchData(slug, propertyId);
  if (!data) notFound();

  const photoUrls = [
    ...(data.property.featuredPhoto ? [data.property.featuredPhoto] : []),
    ...data.property.photos
      .map((p) => p.url)
      .filter((u) => u !== data.property.featuredPhoto),
  ];

  // Org branding overrides site.primaryColor + fontPair when present
  const orgBranding = await getActiveOrgBranding(data.site.userId);

  const showcaseProps = {
    site: {
      slug: data.site.slug,
      template: data.site.template,
      title: orgBranding?.name ?? data.site.title,
      primaryColor: orgBranding?.primaryColor ?? data.site.primaryColor,
      phone: data.site.phone,
      whatsapp: data.site.whatsapp,
      email: data.site.email,
      fontPair: orgBranding?.fontPair ?? data.site.fontPair,
      language: data.site.language,
      enabledSections: data.site.enabledSections,
      logoUrl: orgBranding?.logoUrl ?? null,
      secondaryColor: orgBranding?.secondaryColor ?? null,
      accentColor: orgBranding?.accentColor ?? null,
      whiteLabel: orgBranding?.whiteLabel ?? false,
    },
    agent: { name: data.agent.name },
    property: {
      id: data.property.id,
      title: data.property.title,
      description: data.property.description,
      category: data.property.category,
      operation: data.property.operation,
      status: data.property.status,
      priceUSD: data.property.priceUSD ? Number(data.property.priceUSD) : null,
      priceDOP: data.property.priceDOP ? Number(data.property.priceDOP) : null,
      bedrooms: data.property.bedrooms,
      bathrooms: data.property.bathrooms
        ? Number(data.property.bathrooms)
        : null,
      parking: data.property.parking,
      metersSquared: data.property.metersSquared,
      location: data.property.location,
      address: data.property.address,
      mapsUrl: data.property.mapsUrl,
      lat: data.property.lat ? Number(data.property.lat) : null,
      lng: data.property.lng ? Number(data.property.lng) : null,
      amenities: data.property.amenities,
      finishes: data.property.finishes,
      floorPlans: data.property.floorPlans,
      nearbyPois: data.property.nearbyPois,
      videoUrl: data.property.videoUrl,
      walkthroughUrl: data.property.walkthroughUrl,
      customTagline: data.property.customTagline,
      premiumLanding: data.property.premiumLanding,
      featuredPhoto: data.property.featuredPhoto,
    },
    photos: photoUrls,
  };

  // POIs reales (con coordenadas) para el mapa Mapbox de la landing.
  const pois = data.property.pois
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      description: p.description,
      url: p.url,
      imageUrl: p.imageUrl,
      lat: Number(p.lat),
      lng: Number(p.lng),
      distanceM: p.distanceM,
      walkMinutes: p.walkMinutes,
      carMinutes: p.carMinutes,
      pinned: p.pinned,
      color: p.color,
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  // Premium landing → heavy Cinematic (no mobile variant; cinematic is already responsive).
  if (data.property.premiumLanding) {
    return <CinematicShowcase {...showcaseProps} pois={pois} />;
  }
  return (
    <>
      {/* Mobile: app-style detail con sticky CTA */}
      <div className="md:hidden">
        <PortalMobileProperty {...showcaseProps} />
      </div>
      {/* Desktop: CRM-aligned showcase */}
      <div className="hidden md:block">
        <CinematicCrm {...showcaseProps} />
      </div>
    </>
  );
}
