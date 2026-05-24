"use client";

/**
 * Property landing — CRM aligned design language.
 * Used when premiumLanding=false. The heavy Cinematic remains for premium.
 */

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  Share2,
} from "lucide-react";
import { LanguageProvider, useLang } from "@/components/marketing-site/language-context";
import { LangToggle } from "@/components/marketing-site/lang-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LuxuryAgent, LuxuryProperty, LuxurySite } from "./cinematic-showcase";

function parseJSON<T>(v: string | null | undefined, fallback: T): T {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export function CinematicCrm(props: {
  site: LuxurySite;
  agent: LuxuryAgent;
  property: LuxuryProperty;
  photos: string[];
}) {
  return (
    <LanguageProvider>
      <Showcase {...props} />
    </LanguageProvider>
  );
}

const COPY = {
  es: {
    back: "Volver al catálogo",
    request: "Solicitar visita",
    share: "Compartir",
    sections: {
      overview: "Descripción",
      gallery: "Galería",
      details: "Detalles",
      amenities: "Amenidades",
      location: "Ubicación",
      contact: "Contacto",
    },
    labels: {
      type: "Tipo",
      area: "Área",
      bedrooms: "Habitaciones",
      bathrooms: "Baños",
      parking: "Parqueos",
      year: "Año",
      price: "Precio",
      operation: "Operación",
      sale: "Venta",
      rent: "Alquiler",
      inquire: "Precio a solicitud",
      visit: "Agendar visita",
    },
    contact: {
      title: "Agenda una visita",
      sub: "WhatsApp es el canal más rápido. Respondo el mismo día.",
    },
  },
  en: {
    back: "Back to catalog",
    request: "Request visit",
    share: "Share",
    sections: {
      overview: "Description",
      gallery: "Gallery",
      details: "Details",
      amenities: "Amenities",
      location: "Location",
      contact: "Contact",
    },
    labels: {
      type: "Type",
      area: "Area",
      bedrooms: "Bedrooms",
      bathrooms: "Bathrooms",
      parking: "Parking",
      year: "Year",
      price: "Price",
      operation: "Operation",
      sale: "Sale",
      rent: "Rental",
      inquire: "Price on request",
      visit: "Schedule visit",
    },
    contact: {
      title: "Schedule a visit",
      sub: "WhatsApp is fastest. Same-day reply.",
    },
  },
} as const;

const AMENITY_LABEL_ES: Record<string, string> = {
  POOL: "Piscina",
  GYM: "Gimnasio",
  GARDEN: "Jardín",
  BBQ: "Área BBQ",
  SECURITY: "Seguridad 24/7",
  PARKING: "Parqueo",
  ELEVATOR: "Ascensor",
  BEACH_ACCESS: "Acceso playa",
  TERRACE: "Terraza",
  AIR_CONDITIONING: "Aire acondicionado",
  SOLAR: "Paneles solares",
  GENERATOR: "Planta eléctrica",
  CISTERN: "Cisterna",
  PET_FRIENDLY: "Pet-friendly",
  FURNISHED: "Amueblado",
};
const AMENITY_LABEL_EN: Record<string, string> = {
  POOL: "Pool",
  GYM: "Gym",
  GARDEN: "Garden",
  BBQ: "BBQ area",
  SECURITY: "24/7 security",
  PARKING: "Parking",
  ELEVATOR: "Elevator",
  BEACH_ACCESS: "Beach access",
  TERRACE: "Terrace",
  AIR_CONDITIONING: "Air conditioning",
  SOLAR: "Solar panels",
  GENERATOR: "Backup generator",
  CISTERN: "Cistern",
  PET_FRIENDLY: "Pet-friendly",
  FURNISHED: "Furnished",
};

function Showcase({
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
  const { lang } = useLang();
  const t = COPY[lang];
  const reduced = useReducedMotion();
  const amenitiesMap = lang === "es" ? AMENITY_LABEL_ES : AMENITY_LABEL_EN;

  const hero = photos[0] ?? property.featuredPhoto ?? null;
  const rest = photos.slice(1);
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
  const finishes = parseJSON<string[]>(property.finishes ?? null, []);

  const price = property.priceUSD
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(property.priceUSD)
    : null;

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: property.title,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3 md:px-8">
          <Link
            href={`/p/${site.slug}`}
            className="group inline-flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:-translate-x-0.5" strokeWidth={1.75} />
            <span className="text-muted-foreground transition-colors group-hover:text-foreground">
              {t.back}
            </span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider">
              {site.title ?? agent.name}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <Button size="sm" variant="ghost" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span className="ml-1 hidden sm:inline">{t.share}</span>
            </Button>
            {site.whatsapp && (
              <Button asChild size="sm">
                <a
                  href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hola, me interesa: ${property.title}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-1 h-3.5 w-3.5" strokeWidth={2} />
                  {t.request}
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative px-5 pb-16 pt-10 md:px-8 md:pt-14">
          <div className="mx-auto max-w-[1280px]">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center gap-2 text-xs"
            >
              <Badge
                variant="secondary"
                className={cn(
                  "border text-[10px] font-medium uppercase tracking-wider",
                  isRent
                    ? "border-amber-500/30 bg-amber-500/15 text-amber-600"
                    : "border-emerald-500/30 bg-emerald-500/15 text-emerald-600"
                )}
              >
                {isRent ? t.labels.rent : t.labels.sale}
              </Badge>
              {property.location && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" strokeWidth={1.75} />
                  {property.location}
                </span>
              )}
            </motion.div>

            <motion.h1
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-5 text-[clamp(36px,6vw,68px)] font-semibold leading-[1.05] tracking-[-0.03em]"
            >
              {property.title}
              <span className="text-primary">.</span>
            </motion.h1>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8"
            >
              {/* Photo */}
              <div className="lg:col-span-8">
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted">
                  {hero ? (
                    <Image
                      src={hero}
                      alt={property.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 67vw"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Building2 className="h-16 w-16 text-muted-foreground/40" strokeWidth={1} />
                    </div>
                  )}
                </div>
              </div>

              {/* Fact card */}
              <aside className="lg:col-span-4">
                <div className="rounded-xl border border-border bg-card p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.labels.price}
                  </p>
                  {price ? (
                    <p className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-tight">
                      {price}
                      {isRent && (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">/ mes</span>
                      )}
                    </p>
                  ) : (
                    <p className="mt-1 text-base text-muted-foreground">{t.labels.inquire}</p>
                  )}

                  <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
                    {property.metersSquared && (
                      <Fact icon={Ruler} label={t.labels.area} value={`${property.metersSquared} m²`} />
                    )}
                    {property.bedrooms !== null && property.bedrooms > 0 && (
                      <Fact icon={BedDouble} label={t.labels.bedrooms} value={String(property.bedrooms)} />
                    )}
                    {property.bathrooms !== null && property.bathrooms !== undefined && (
                      <Fact icon={Bath} label={t.labels.bathrooms} value={String(property.bathrooms)} />
                    )}
                    {property.parking !== null && property.parking !== undefined && property.parking > 0 && (
                      <Fact icon={Car} label={t.labels.parking} value={String(property.parking)} />
                    )}
                  </dl>

                  <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5">
                    {site.whatsapp && (
                      <Button asChild size="lg" className="w-full">
                        <a
                          href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Hola, me interesa: ${property.title}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="mr-1.5 h-4 w-4" strokeWidth={2} />
                          {t.labels.visit}
                        </a>
                      </Button>
                    )}
                    {site.phone && (
                      <Button asChild size="lg" variant="outline" className="w-full">
                        <a href={`tel:${site.phone.replace(/\D/g, "")}`}>
                          <Phone className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
                          {site.phone}
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                      {agent.name
                        .split(" ")
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{agent.name}</p>
                      <p className="text-[10px] uppercase tracking-wider">
                        {site.title ?? "estaila"}
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </motion.div>
          </div>
        </section>

        {/* DESCRIPTION */}
        {property.description && (
          <section className="border-t border-border/60 px-5 py-20 md:px-8 md:py-24">
            <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <Eyebrow>{t.sections.overview}</Eyebrow>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                  {lang === "es" ? "Sobre la propiedad" : "About this property"}
                </h2>
              </div>
              <div className="lg:col-span-8">
                <p
                  className="text-lg leading-relaxed text-foreground/90 md:text-xl"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  <span className="text-3xl leading-none text-primary">“</span>
                  {property.description}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* GALLERY */}
        {rest.length > 0 && (
          <section className="border-t border-border/60 bg-card/20 px-5 py-20 md:px-8 md:py-24">
            <div className="mx-auto max-w-[1280px]">
              <Eyebrow>{t.sections.gallery}</Eyebrow>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                {lang === "es" ? "Galería" : "Gallery"}
              </h2>
              <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((photo, i) => (
                  <motion.div
                    key={i}
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: Math.min(i, 8) * 0.04 }}
                    className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <Image
                      src={photo}
                      alt={`${property.title} — ${i + 2}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* AMENITIES */}
        {(amenities.length > 0 || finishes.length > 0) && (
          <section className="border-t border-border/60 px-5 py-20 md:px-8 md:py-24">
            <div className="mx-auto max-w-[1280px]">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <Eyebrow>{t.sections.amenities}</Eyebrow>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                    {lang === "es" ? "Lo que incluye" : "What's included"}
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:col-span-8 sm:grid-cols-3">
                  {[
                    ...amenities,
                    ...finishes.map((f) => ({ key: f, custom: undefined })),
                  ].map((it, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-card/60 px-3 py-2.5 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                      <span className="truncate">
                        {it.custom ?? amenitiesMap[it.key] ?? it.key.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* LOCATION */}
        {(property.address || property.mapsUrl) && (
          <section className="border-t border-border/60 bg-card/20 px-5 py-20 md:px-8 md:py-24">
            <div className="mx-auto max-w-[1280px]">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <Eyebrow>{t.sections.location}</Eyebrow>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                    {lang === "es" ? "Dónde está" : "Where it is"}
                  </h2>
                  {property.address && (
                    <p className="mt-4 max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
                      {property.address}
                    </p>
                  )}
                  {property.mapsUrl && (
                    <Button asChild className="mt-6" variant="outline">
                      <a href={property.mapsUrl} target="_blank" rel="noreferrer">
                        {lang === "es" ? "Abrir en mapas" : "Open in Maps"}
                        <ArrowUpRight className="ml-1 h-4 w-4" strokeWidth={1.75} />
                      </a>
                    </Button>
                  )}
                </div>
                <div className="lg:col-span-8">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-muted">
                    <div className="bg-dots absolute inset-0 opacity-60" aria-hidden />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                        <MapPin className="h-6 w-6" strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CONTACT CTA */}
        <section className="relative overflow-hidden border-t border-border/60 px-5 py-24 md:px-8 md:py-28">
          <div className="ambient-glow opacity-60" aria-hidden />
          <div className="relative mx-auto grid max-w-[1180px] grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6">
              <Eyebrow>{t.sections.contact}</Eyebrow>
              <h2 className="mt-3 text-[clamp(36px,6vw,64px)] font-semibold leading-[1.05] tracking-[-0.03em]">
                {t.contact.title.split(" ").slice(0, -1).join(" ")}{" "}
                <span
                  className="italic text-primary"
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontWeight: 500,
                  }}
                >
                  {t.contact.title.split(" ").slice(-1)[0]}
                </span>
              </h2>
              <p className="mt-5 max-w-[44ch] text-base text-muted-foreground md:text-lg">
                {t.contact.sub}
              </p>
            </div>
            <div className="lg:col-span-6">
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {site.whatsapp && (
                  <ContactBigRow
                    icon={MessageCircle}
                    label="WhatsApp"
                    value={site.whatsapp}
                    href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                      lang === "es"
                        ? `Hola, me interesa ${property.title}`
                        : `Hi, I'm interested in ${property.title}`
                    )}`}
                  />
                )}
                {site.email && (
                  <ContactBigRow
                    icon={Mail}
                    label="Email"
                    value={site.email}
                    href={`mailto:${site.email}?subject=${encodeURIComponent(property.title)}`}
                  />
                )}
                {site.phone && (
                  <ContactBigRow
                    icon={Phone}
                    label={lang === "es" ? "Teléfono" : "Phone"}
                    value={site.phone}
                    href={`tel:${site.phone.replace(/\D/g, "")}`}
                  />
                )}
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card/30">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5 py-6 md:px-8">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} · {agent.name}
          </p>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// SHARED
// ============================================================

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BedDouble;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" strokeWidth={1.75} />
        {label}
      </dt>
      <dd className="mt-0.5 text-base font-semibold tabular-nums tracking-tight">
        {value}
      </dd>
    </div>
  );
}

function ContactBigRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof MessageCircle;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center justify-between gap-4 p-5 transition-colors hover:bg-card/70"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-0.5 truncate text-base font-semibold tracking-tight">{value}</p>
          </div>
        </div>
        <ArrowUpRight
          className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
          strokeWidth={1.75}
        />
      </a>
    </li>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
      <span className="text-primary">●</span> <span className="ml-1">{children}</span>
    </p>
  );
}
