import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { DigitalCardView } from "@/components/cards/digital-card-view";

export const dynamic = "force-dynamic";

async function fetchCard(slug: string) {
  const card = await prisma.digitalCard.findUnique({
    where: { slug },
    include: {
      links: { where: { active: true }, orderBy: { order: "asc" } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          site: {
            select: { slug: true, whatsapp: true, phone: true, email: true },
          },
        },
      },
    },
  });
  if (!card || !card.isActive) return null;

  let properties: { id: string; title: string; featuredPhoto: string | null; priceUSD: number | null; location: string | null; operation: string }[] = [];
  if (card.showProperties) {
    const props = await prisma.property.findMany({
      where: {
        userId: card.userId,
        operation: { in: ["EN_VENTA", "EN_ALQUILER", "CONSIGNACION"] },
        status: { notIn: ["VENDIDA", "ALQUILADA"] },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        featuredPhoto: true,
        priceUSD: true,
        location: true,
        operation: true,
      },
    });
    properties = props.map((p) => ({
      ...p,
      priceUSD: p.priceUSD ? Number(p.priceUSD) : null,
    }));
  }

  return { card, properties };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchCard(slug);
  if (!data) return { title: "Tarjeta no encontrada" };
  return {
    title: `${data.card.title} · Tarjeta digital`,
    description: data.card.bio ?? data.card.role ?? "Tarjeta digital",
    openGraph: {
      title: data.card.title,
      description: data.card.bio ?? data.card.role ?? "",
      images: data.card.avatarUrl ? [{ url: data.card.avatarUrl }] : undefined,
    },
  };
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchCard(slug);
  if (!data) notFound();

  return (
    <DigitalCardView
      card={{
        id: data.card.id,
        slug: data.card.slug,
        title: data.card.title,
        role: data.card.role,
        bio: data.card.bio,
        avatarUrl: data.card.avatarUrl,
        coverUrl: data.card.coverUrl,
        theme: data.card.theme,
        primaryColor: data.card.primaryColor,
        accentColor: data.card.accentColor,
        showProperties: data.card.showProperties,
        showWhatsapp: data.card.showWhatsapp,
        links: data.card.links.map((l) => ({
          id: l.id,
          label: l.label,
          url: l.url,
          icon: l.icon,
          imageUrl: l.imageUrl,
          description: l.description,
          color: l.color,
          highlight: l.highlight,
        })),
      }}
      agent={{
        name: data.card.user.name,
        image: data.card.user.image,
        siteSlug: data.card.user.site?.slug ?? null,
        whatsapp: data.card.user.site?.whatsapp ?? null,
        phone: data.card.user.site?.phone ?? null,
        email: data.card.user.site?.email ?? data.card.user.email,
      }}
      properties={data.properties}
    />
  );
}
