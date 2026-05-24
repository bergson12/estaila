import {
  ArrowLeft,
  Bed,
  Bath,
  Car,
  Maximize2,
  MapPin,
  Pencil,
  Sparkles,
  User,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { PropertyHubTabs } from "@/components/properties/property-hub-tabs";
import { PropertyShareButton } from "@/components/properties/property-share-button";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-server";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  labelFor,
  CATEGORIES,
  OPERATIONS,
  PROPERTY_STATUSES,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const [property, site] = await Promise.all([
    prisma.property.findFirst({
      where: { id, userId: user.id },
      include: {
        owner: { select: { id: true, name: true, phone: true, whatsapp: true } },
        photos: { orderBy: { order: "asc" } },
        transactions: { orderBy: { date: "desc" }, take: 5 },
        pipelineCards: { include: { contact: { select: { name: true } } } },
        appointments: { orderBy: { startAt: "desc" }, take: 5 },
        pois: { orderBy: [{ pinned: "desc" }, { order: "asc" }] },
        marketingKits: {
          orderBy: { updatedAt: "desc" },
          take: 50,
        },
      },
    }),
    prisma.site.findUnique({
      where: { userId: user.id },
      select: { slug: true, published: true },
    }),
  ]);

  if (!property) notFound();

  const poiData = property.pois.map((p) => ({
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
  }));

  const mapProperty = {
    id: property.id,
    title: property.title,
    location: property.location,
    lat: property.lat != null ? Number(property.lat) : null,
    lng: property.lng != null ? Number(property.lng) : null,
  };

  const allPhotoUrls = [
    ...(property.featuredPhoto ? [property.featuredPhoto] : []),
    ...property.photos
      .map((p) => p.url)
      .filter((u) => u !== property.featuredPhoto),
  ];

  const hubProperty = {
    id: property.id,
    title: property.title,
    category: property.category,
    operation: property.operation,
    featuredPhoto: property.featuredPhoto,
    priceUSD: property.priceUSD ? Number(property.priceUSD) : null,
    location: property.location,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms ? Number(property.bathrooms) : null,
    metersSquared: property.metersSquared,
  };

  const overview = (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <PropertyGallery photos={allPhotoUrls} title={property.title} />

        <Card className="p-6">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {labelFor(CATEGORIES, property.category)}
            </Badge>
            <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
              {labelFor(OPERATIONS, property.operation)}
            </Badge>
            {property.status && property.status !== "NUEVO" && (
              <Badge variant="outline">
                {labelFor(PROPERTY_STATUSES, property.status)}
              </Badge>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <p className="font-mono text-3xl font-bold tabular-nums">
              {formatCurrency(Number(property.priceUSD ?? 0))}
            </p>
            {property.priceDOP && Number(property.priceDOP) > 0 && (
              <p className="font-mono text-sm text-muted-foreground tabular-nums">
                / {formatCurrency(Number(property.priceDOP), "DOP")}
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {property.bedrooms != null && (
              <SpecBlock
                icon={<Bed className="h-4 w-4" />}
                label="Habitaciones"
                value={String(property.bedrooms)}
              />
            )}
            {property.bathrooms != null && (
              <SpecBlock
                icon={<Bath className="h-4 w-4" />}
                label="Baños"
                value={property.bathrooms.toString()}
              />
            )}
            {property.parking != null && (
              <SpecBlock
                icon={<Car className="h-4 w-4" />}
                label="Parqueos"
                value={String(property.parking)}
              />
            )}
            {property.metersSquared != null && (
              <SpecBlock
                icon={<Maximize2 className="h-4 w-4" />}
                label="Metros²"
                value={`${property.metersSquared} m²`}
              />
            )}
          </div>

          {property.description && (
            <>
              <div className="my-6 h-px bg-border" />
              <h3 className="mb-2 text-sm font-semibold">Descripción</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {property.description}
              </p>
            </>
          )}

          {(property.location || property.address || property.mapsUrl) && (
            <>
              <div className="my-6 h-px bg-border" />
              <h3 className="mb-2 text-sm font-semibold">Ubicación</h3>
              <div className="space-y-1.5 text-sm">
                {property.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {property.location}
                  </p>
                )}
                {property.address && (
                  <p className="text-muted-foreground">{property.address}</p>
                )}
                {property.mapsUrl && (
                  <a
                    href={property.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Ver en Google Maps
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        {property.owner && (
          <Card className="p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Propietario
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {property.owner.name}
                </p>
                {property.owner.phone && (
                  <p className="truncate font-mono text-xs text-muted-foreground tabular-nums">
                    {property.owner.phone}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {property.pipelineCards.length > 0 && (
          <Card className="p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pipeline ({property.pipelineCards.length})
            </h3>
            <ul className="space-y-2">
              {property.pipelineCards.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate">{c.contact.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {c.stage}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {property.transactions.length > 0 && (
          <Card className="p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Transacciones recientes
            </h3>
            <ul className="space-y-2.5 text-sm">
              {property.transactions.map((t) => (
                <li key={t.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate">{t.concept}</span>
                    <span
                      className={`shrink-0 font-mono font-semibold tabular-nums ${
                        t.category === "INGRESO"
                          ? "text-emerald-500"
                          : "text-destructive"
                      }`}
                    >
                      {t.category === "INGRESO" ? "+" : "−"}
                      {formatCurrency(Number(t.amount))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(t.date)} · {t.status}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {property.appointments.length > 0 && (
          <Card className="p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Citas
            </h3>
            <ul className="space-y-2.5 text-sm">
              {property.appointments.map((a) => (
                <li key={a.id}>
                  <p className="truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(a.startAt)} · {a.status}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/propiedades"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Volver a propiedades
      </Link>

      <PageHeader
        title={property.title}
        description={property.location ?? undefined}
        actions={
          <>
            <PropertyShareButton
              property={{
                id: property.id,
                title: property.title,
                location: property.location,
                priceUSD: property.priceUSD ? Number(property.priceUSD) : null,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms
                  ? Number(property.bathrooms)
                  : null,
                metersSquared: property.metersSquared,
                category: property.category,
                operation: property.operation,
              }}
              agentName={user.name}
            />
            <Button variant="outline" asChild>
              <Link
                href={
                  property.featuredPhoto
                    ? `/studio/staging?photoUrl=${encodeURIComponent(property.featuredPhoto)}`
                    : `/studio`
                }
              >
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                Editar con Studio IA
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/propiedades/${property.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          </>
        }
      />

      <PropertyHubTabs
        property={hubProperty}
        hasSite={!!site?.published}
        siteSlug={site?.slug ?? null}
        mapProperty={mapProperty}
        pois={poiData}
        marketingKits={property.marketingKits}
      >
        {overview}
      </PropertyHubTabs>
    </div>
  );
}

function SpecBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 font-mono text-base font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
