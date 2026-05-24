import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AgentPortalCrm } from "@/components/portal/templates/agent-portal-crm";
import { PortalMobileHome } from "@/components/portal/mobile/portal-mobile-home";
import { getActiveOrgBranding } from "@/lib/org-branding";
import type { PortalData } from "@/components/portal/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

async function fetchData(slug: string): Promise<PortalData | null> {
  const site = await prisma.site.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
  if (!site || !site.published) return null;

  // Override site branding with active org branding when agent is in a team
  const orgBranding = await getActiveOrgBranding(site.userId);

  const properties = await prisma.property.findMany({
    where: {
      userId: site.userId,
      operation: { in: ["EN_VENTA", "EN_ALQUILER", "CONSIGNACION"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      featuredPhoto: true,
      priceUSD: true,
      priceDOP: true,
      category: true,
      operation: true,
      status: true,
      bedrooms: true,
      bathrooms: true,
      parking: true,
      metersSquared: true,
      location: true,
    },
  });

  return {
    site: {
      slug: site.slug,
      template: site.template,
      title: orgBranding?.name ?? site.title,
      tagline: site.tagline,
      about: site.about,
      primaryColor: orgBranding?.primaryColor ?? site.primaryColor,
      logoUrl: orgBranding?.logoUrl ?? site.logoUrl,
      coverUrl: site.coverUrl,
      phone: site.phone,
      whatsapp: site.whatsapp,
      email: site.email,
      facebookUrl: site.facebookUrl,
      instagramUrl: site.instagramUrl,
      tiktokUrl: site.tiktokUrl,
    },
    agent: {
      name: site.user.name,
      email: site.user.email,
      image: site.user.image,
    },
    properties: properties.map((p) => ({
      id: p.id,
      title: p.title,
      featuredPhoto: p.featuredPhoto,
      priceUSD: p.priceUSD ? Number(p.priceUSD) : null,
      priceDOP: p.priceDOP ? Number(p.priceDOP) : null,
      category: p.category,
      operation: p.operation,
      status: p.status,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms ? Number(p.bathrooms) : null,
      parking: p.parking,
      metersSquared: p.metersSquared,
      location: p.location,
    })),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchData(slug);
  if (!data) return { title: "Portal no encontrado" };

  const title = data.site.title
    ? `${data.site.title} — Propiedades`
    : `${data.agent.name} — Portal Inmobiliario`;
  const description =
    data.site.tagline ??
    `Propiedades en venta y alquiler con ${data.agent.name}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: data.properties[0]?.featuredPhoto
        ? [{ url: data.properties[0].featuredPhoto }]
        : undefined,
    },
  };
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchData(slug);
  if (!data) notFound();

  return (
    <>
      {/* Mobile: app-style browser */}
      <div className="md:hidden">
        <PortalMobileHome {...data} />
      </div>
      {/* Desktop: full CRM-aligned portal */}
      <div className="hidden md:block">
        <AgentPortalCrm {...data} />
      </div>
    </>
  );
}
