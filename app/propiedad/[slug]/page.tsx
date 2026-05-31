import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { recordPropertyView, deviceFromUA, decodeCity } from "@/lib/analytics";
import { getActiveOrgBranding } from "@/lib/org-branding";
import { PublicPropertyView } from "@/components/property-public/public-property-view";

export const dynamic = "force-dynamic";

async function loadProperty(slug: string) {
  return prisma.property.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { order: "asc" } },
      pois: { orderBy: [{ pinned: "desc" }, { order: "asc" }] },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          agentRole: true,
          agentLocation: true,
          agentPhone: true,
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await loadProperty(slug);
  if (!p || !p.publicEnabled) return { title: "Propiedad" };

  const priceStr =
    p.priceUSD != null
      ? `US$${Number(p.priceUSD).toLocaleString("en-US")}`
      : "Consultar precio";
  const specs = [
    p.bedrooms != null ? `${p.bedrooms} hab` : null,
    p.bathrooms != null ? `${p.bathrooms} baños` : null,
    p.metersSquared != null ? `${p.metersSquared} m²` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const description = `${priceStr}${specs ? ` · ${specs}` : ""}${
    p.location ? ` · ${p.location}` : ""
  }. ${p.description?.slice(0, 140) ?? ""}`.trim();

  const ogImage = p.featuredPhoto ?? p.photos[0]?.url;

  return {
    title: `${p.title} · ${priceStr}`,
    description,
    openGraph: {
      title: p.title,
      description,
      type: "website",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description,
      images: ogImage ? [ogImage] : [],
    },
    other: p.priceUSD
      ? {
          "product:price:amount": String(Number(p.priceUSD)),
          "product:price:currency": "USD",
        }
      : undefined,
  };
}

export default async function PublicPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const property = await loadProperty(slug);
  if (!property || !property.publicEnabled) notFound();

  // White-label accent: org branding → agent's site color → estaila green
  const [orgBranding, userSite] = await Promise.all([
    getActiveOrgBranding(property.userId),
    prisma.site.findUnique({
      where: { userId: property.userId },
      select: { primaryColor: true },
    }),
  ]);
  const brandColor = orgBranding?.primaryColor ?? userSite?.primaryColor ?? null;

  // Increment publicViews (best-effort, async)
  prisma.property
    .update({
      where: { id: property.id },
      data: { publicViews: { increment: 1 } },
    })
    .catch(() => {});

  // Build absolute URL for share previews / JSON-LD
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("host") ?? "estaila.com";
  const canonical = `${proto}://${host}/propiedad/${slug}`;

  // Evento de vista enriquecido (device / ciudad / referrer) — best-effort.
  void recordPropertyView({
    propertyId: property.id,
    device: deviceFromUA(hdrs.get("user-agent")),
    country: hdrs.get("x-vercel-ip-country"),
    city: decodeCity(hdrs.get("x-vercel-ip-city")),
    referrer: hdrs.get("referer"),
  });

  const photos = [
    ...(property.featuredPhoto ? [property.featuredPhoto] : []),
    ...property.photos
      .map((ph) => ph.url)
      .filter((u) => u !== property.featuredPhoto),
  ];

  return (
    <>
      {/* Schema.org JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: property.title,
            url: canonical,
            image: photos.slice(0, 5),
            description: property.description ?? undefined,
            offers: property.priceUSD
              ? {
                  "@type": "Offer",
                  price: Number(property.priceUSD),
                  priceCurrency: "USD",
                  availability:
                    property.operation === "EN_VENTA" ||
                    property.operation === "EN_ALQUILER"
                      ? "https://schema.org/InStock"
                      : "https://schema.org/SoldOut",
                }
              : undefined,
            numberOfRooms: property.bedrooms ?? undefined,
            numberOfBathroomsTotal: property.bathrooms
              ? Number(property.bathrooms)
              : undefined,
            floorSize: property.metersSquared
              ? {
                  "@type": "QuantitativeValue",
                  value: property.metersSquared,
                  unitCode: "MTK",
                }
              : undefined,
            address: property.address ?? property.location ?? undefined,
            geo:
              property.lat && property.lng
                ? {
                    "@type": "GeoCoordinates",
                    latitude: Number(property.lat),
                    longitude: Number(property.lng),
                  }
                : undefined,
          }),
        }}
      />

      <PublicPropertyView
        property={{
          id: property.id,
          slug: property.slug!,
          title: property.title,
          description: property.description,
          category: property.category,
          operation: property.operation,
          priceUSD: property.priceUSD ? Number(property.priceUSD) : null,
          priceDOP: property.priceDOP ? Number(property.priceDOP) : null,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms ? Number(property.bathrooms) : null,
          parking: property.parking,
          metersSquared: property.metersSquared,
          location: property.location,
          address: property.address,
          lat: property.lat ? Number(property.lat) : null,
          lng: property.lng ? Number(property.lng) : null,
          featuredPhoto: property.featuredPhoto,
          photos,
          premiumLanding: property.premiumLanding ?? false,
          pois: property.pois.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            description: p.description,
            url: p.url,
            imageUrl: p.imageUrl,
            lat: p.lat,
            lng: p.lng,
            distanceM: p.distanceM,
            walkMinutes: p.walkMinutes,
            carMinutes: p.carMinutes,
            pinned: p.pinned,
            color: p.color,
          })),
        }}
        agent={{
          name: property.user.name,
          email: property.user.email,
          phone: property.user.agentPhone,
          location: property.user.agentLocation,
          role: property.user.agentRole,
          avatar: property.user.image,
        }}
        trackingRef={ref ?? null}
        brandColor={brandColor}
      />
    </>
  );
}
