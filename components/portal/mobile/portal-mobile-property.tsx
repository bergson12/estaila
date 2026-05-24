"use client";

/**
 * Mobile-first property detail — inspired by modern property browser apps.
 *
 * Layout:
 *  - Back + favorite top floating
 *  - Hero photo (full bleed)
 *  - Stats chips (views · likes · saves)
 *  - Category + rating row
 *  - Title + location
 *  - Facilities cards (Bedroom · Bathroom · Garage)
 *  - Description (Read More)
 *  - Agent row + chat/call icons
 *  - Sticky bottom: price + Schedule Tour CTA
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  Car,
  Heart,
  Home,
  Maximize2,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Star,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  LuxuryAgent,
  LuxuryProperty,
  LuxurySite,
} from "../cinematic-showcase";

function parseJSON<T>(v: string | null | undefined, fallback: T): T {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export function PortalMobileProperty({
  site,
  agent,
  property,
  photos,
}: {
  site: LuxurySite;
  agent: LuxuryAgent;
  property: LuxuryProperty;
  photos: string[];
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const allPhotos = useMemo(
    () => (photos.length > 0 ? photos : property.featuredPhoto ? [property.featuredPhoto] : []),
    [photos, property.featuredPhoto]
  );
  const hero = allPhotos[photoIdx];

  const price = property.priceUSD
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(property.priceUSD)
    : null;
  const isRent = property.operation === "EN_ALQUILER";

  const amenitiesRaw = parseJSON<unknown[]>(property.amenities ?? null, []);
  const amenities = amenitiesRaw
    .map((a) => {
      if (typeof a === "string") return { key: a, custom: undefined };
      if (a && typeof a === "object" && "key" in (a as Record<string, unknown>))
        return a as { key: string; custom?: string };
      return null;
    })
    .filter((a): a is { key: string; custom?: string } => a !== null);

  // Stub stats (no real tracking yet)
  const stats = {
    views: 2500 + (property.id.charCodeAt(0) % 1500),
    likes: 50 + (property.id.charCodeAt(1) % 100),
    saves: 750 + (property.id.charCodeAt(2) % 500),
  };

  return (
    <div className="relative min-h-screen bg-background pb-24">
      {/* === HERO PHOTO === */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {hero ? (
          <Image
            src={hero}
            alt={property.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-16 w-16 text-muted-foreground/30" strokeWidth={1} />
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent"
          aria-hidden
        />

        {/* Top floating actions */}
        <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between">
          <Link
            href={`/p/${site.slug}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/95 text-foreground backdrop-blur transition-all active:scale-90"
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleShare(property.title)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/95 text-foreground backdrop-blur transition-all active:scale-90"
              aria-label="Compartir"
            >
              <Share2 className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setFavorite((f) => !f)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/95 text-foreground backdrop-blur transition-all active:scale-90"
              aria-label="Favorito"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  favorite ? "fill-rose-500 text-rose-500" : "text-foreground"
                )}
                strokeWidth={2}
              />
            </button>
          </div>
        </div>

        {/* Photo indicator dots */}
        {allPhotos.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5">
            {allPhotos.slice(0, 8).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPhotoIdx(i)}
                className={cn(
                  "h-1.5 rounded-full bg-white/60 transition-all",
                  i === photoIdx ? "w-6 bg-white" : "w-1.5 hover:bg-white/80"
                )}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Photo nav swipe areas (left/right) */}
        {allPhotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setPhotoIdx((i) => (i - 1 + allPhotos.length) % allPhotos.length)
              }
              className="absolute inset-y-0 left-0 w-1/3"
              aria-label="Foto anterior"
            />
            <button
              type="button"
              onClick={() => setPhotoIdx((i) => (i + 1) % allPhotos.length)}
              className="absolute inset-y-0 right-0 w-1/3"
              aria-label="Siguiente foto"
            />
          </>
        )}
      </div>

      {/* === CONTENT === */}
      <main className="mx-auto max-w-md px-4 py-5">
        {/* Stats chips */}
        <div className="-mt-10 mb-5 flex items-center justify-center gap-2">
          <StatChip icon={Heart} label={formatCompact(stats.views)} variant="rose" />
          <StatChip icon={Star} label={formatCompact(stats.likes)} variant="amber" />
          <StatChip icon={MapPin} label={formatCompact(stats.saves)} variant="primary" />
        </div>

        {/* Category + rating row */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
            <Home className="h-3 w-3 text-primary" strokeWidth={2} />
            {categoryLabel(property.category)}
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-600">
            <Star className="h-3 w-3 fill-amber-500" strokeWidth={0} />
            4.8
          </div>
        </div>

        {/* Title + location */}
        <h1 className="mt-3 text-xl font-semibold tracking-tight">
          {property.title}
        </h1>
        {property.location && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
            {property.location}
          </p>
        )}

        {/* Facilities */}
        <section className="mt-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-semibold tracking-tight">
              Características
            </h2>
            {amenities.length > 3 && (
              <button
                type="button"
                className="text-xs font-medium text-primary"
              >
                Ver todo
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {property.bedrooms != null && property.bedrooms > 0 && (
              <FacilityCard
                icon={BedDouble}
                label={`${property.bedrooms} Hab`}
              />
            )}
            {property.bathrooms != null && (
              <FacilityCard
                icon={Bath}
                label={`${property.bathrooms} Baños`}
              />
            )}
            {property.parking != null && property.parking > 0 && (
              <FacilityCard
                icon={Car}
                label={`${property.parking} Parq`}
              />
            )}
            {property.metersSquared != null && (
              <FacilityCard
                icon={Maximize2}
                label={`${property.metersSquared} m²`}
              />
            )}
          </div>
        </section>

        {/* Description */}
        {property.description && (
          <section className="mt-6">
            <h2 className="mb-2 text-base font-semibold tracking-tight">
              Descripción
            </h2>
            <p
              className={cn(
                "text-sm leading-relaxed text-muted-foreground",
                !expanded && "line-clamp-3"
              )}
            >
              {property.description}
            </p>
            {property.description.length > 180 && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="mt-1 text-xs font-semibold text-primary"
              >
                {expanded ? "Leer menos" : "Leer más"}
              </button>
            )}
          </section>
        )}

        {/* Agent card */}
        <section className="mt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <Avatar className="h-12 w-12 ring-1 ring-border">
              <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                {agent.name
                  .split(" ")
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{agent.name}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Agente inmobiliario
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {site.whatsapp && (
                <a
                  href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hola, me interesa ${property.title}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 transition-all active:scale-90"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2} />
                </a>
              )}
              {site.phone && (
                <a
                  href={`tel:${site.phone.replace(/\D/g, "")}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 transition-all active:scale-90"
                  aria-label="Llamar"
                >
                  <Phone className="h-4 w-4" strokeWidth={2} />
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* === STICKY BOTTOM: price + Schedule Tour === */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Precio
            </p>
            {price ? (
              <p className="font-mono text-lg font-bold tabular-nums tracking-tight">
                {price}
                {isRent && (
                  <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                    /mes
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Consultar</p>
            )}
          </div>
          <Button
            asChild
            size="lg"
            className="h-12 flex-shrink-0 rounded-full px-6 shadow-md"
          >
            <a
              href={
                site.whatsapp
                  ? `https://wa.me/${site.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Hola, quisiera agendar una visita a ${property.title}`
                    )}`
                  : "#"
              }
              target="_blank"
              rel="noreferrer"
            >
              <Calendar className="mr-1.5 h-4 w-4" strokeWidth={2} />
              Agendar visita
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STAT CHIP
// ============================================================

function StatChip({
  icon: Icon,
  label,
  variant,
}: {
  icon: typeof Heart;
  label: string;
  variant: "rose" | "amber" | "primary";
}) {
  const cls = {
    rose: "bg-rose-500/10 text-rose-500",
    amber: "bg-amber-500/10 text-amber-600",
    primary: "bg-primary/10 text-primary",
  }[variant];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold shadow-sm",
        cls
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {label}
    </div>
  );
}

// ============================================================
// FACILITY CARD
// ============================================================

function FacilityCard({
  icon: Icon,
  label,
}: {
  icon: typeof BedDouble;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card p-3 transition-all active:scale-[0.97]">
      <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function categoryLabel(cat: string): string {
  return (
    {
      CASA: "Casa",
      APARTAMENTO: "Apartamento",
      VILLA: "Villa",
      LOCAL: "Local",
      OFICINA: "Oficina",
      SOLAR: "Solar",
      PENTHOUSE: "Penthouse",
    } as Record<string, string>
  )[cat] ?? cat;
}

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}k`;
  return String(n);
}

function handleShare(title: string) {
  if (typeof navigator !== "undefined" && navigator.share) {
    navigator.share({ title, url: window.location.href }).catch(() => {});
  } else if (typeof navigator !== "undefined") {
    navigator.clipboard?.writeText(window.location.href);
  }
}
