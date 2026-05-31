import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { PropertyForm } from "@/components/properties/property-form";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/server";

export default async function EditPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const t = await getDict();

  const [property, owners, currentUser] = await Promise.all([
    prisma.property.findFirst({
      where: { id, userId: user.id },
      include: {
        photos: { orderBy: { order: "asc" }, select: { url: true } },
      },
    }),
    prisma.contact.findMany({
      where: { userId: user.id, type: "PROPIETARIO" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    }),
  ]);

  if (!property) notFound();

  // Collect all photo URLs, dedup with featured first
  const photoUrls = Array.from(
    new Set([
      ...(property.featuredPhoto ? [property.featuredPhoto] : []),
      ...property.photos.map((p) => p.url),
    ])
  );

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/propiedades/${property.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        {t.propForm.backToDetail}
      </Link>
      <PageHeader
        title={`${t.propForm.editPagePrefix} ${property.title}`}
        description={t.propForm.editPageDesc}
      />
      <PropertyForm
        userPlan={currentUser?.plan ?? "FREE"}
        initial={{
          id: property.id,
          title: property.title,
          description: property.description ?? "",
          category: property.category,
          operation: property.operation,
          status: property.status,
          priceUSD: property.priceUSD ? Number(property.priceUSD) : undefined,
          priceDOP: property.priceDOP ? Number(property.priceDOP) : undefined,
          bedrooms: property.bedrooms ?? undefined,
          bathrooms: property.bathrooms ? Number(property.bathrooms) : undefined,
          parking: property.parking ?? undefined,
          metersSquared: property.metersSquared ?? undefined,
          location: property.location ?? "",
          address: property.address ?? "",
          mapsUrl: property.mapsUrl ?? "",
          ownerId: property.ownerId ?? "",
          featuredPhoto: property.featuredPhoto ?? undefined,
          initialPhotos: photoUrls,
          // Luxury landing fields
          premiumLanding: property.premiumLanding ?? false,
          customTagline: property.customTagline ?? undefined,
          videoUrl: property.videoUrl ?? undefined,
          walkthroughUrl: property.walkthroughUrl ?? undefined,
          lat: property.lat ? Number(property.lat) : undefined,
          lng: property.lng ? Number(property.lng) : undefined,
          amenities: property.amenities,
          finishes: property.finishes,
          nearbyPois: property.nearbyPois,
          floorPlans: property.floorPlans,
        }}
        ownerOptions={owners.map((o) => ({ value: o.id, label: o.name }))}
      />
    </div>
  );
}
