"use client";

import {
  Bath,
  Bed,
  Building2,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  Globe,
  Layers,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  Send,
} from "lucide-react";
import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitPublicLead } from "@/lib/actions/lead";
import { cn, initials } from "@/lib/utils";

// Lazy-load Mapbox map (browser-only)
const PropertyMap = dynamic(
  () =>
    import("@/components/properties/map/property-map").then((m) => m.PropertyMap),
  { ssr: false }
);

type POI = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  lat: number;
  lng: number;
  distanceM: number | null;
  walkMinutes: number | null;
  carMinutes: number | null;
  pinned: boolean;
  color: string | null;
};

export type PublicPropertyData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  operation: string;
  priceUSD: number | null;
  priceDOP: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  metersSquared: number | null;
  location: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  featuredPhoto: string | null;
  photos: string[];
  pois: POI[];
  premiumLanding: boolean;
};

export type PublicAgent = {
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  role: string | null;
  avatar: string | null;
};

const OP_LABEL: Record<string, string> = {
  EN_VENTA: "En venta",
  EN_ALQUILER: "En alquiler",
  VENDIDA: "Vendida",
  ALQUILADA: "Alquilada",
  CONSIGNACION: "En consignación",
};

const CAT_LABEL: Record<string, string> = {
  CASA: "Casa",
  APARTAMENTO: "Apartamento",
  VILLA: "Villa",
  TERRENO: "Terreno",
  LOCAL: "Local comercial",
  LOCAL_COMERCIAL: "Local comercial",
  OFICINA: "Oficina",
  EDIFICIO: "Edificio",
  SOLAR: "Solar",
};

// White-label brand palette — exposed as CSS vars driven by the agent's brand
// color (Organization branding or Site.primaryColor), falling back to estaila green.
function brandVars(brandColor?: string | null): React.CSSProperties {
  const b = brandColor || "#00BF63";
  return {
    "--brand": b,
    "--brand-700": `color-mix(in srgb, ${b} 80%, black)`,
  } as React.CSSProperties;
}

function formatPrice(amount: number | null, currency: "USD" | "DOP") {
  if (amount == null) return "Consultar precio";
  return `${currency === "USD" ? "US$ " : "RD$ "}${amount.toLocaleString(
    "en-US",
    { maximumFractionDigits: 0 }
  )}`;
}

function waLink(phone: string, text: string) {
  const num = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

function poiDistance(p: POI) {
  if (p.distanceM == null) return null;
  return p.distanceM < 1000
    ? `${p.distanceM}m`
    : `${(p.distanceM / 1000).toFixed(1)}km`;
}

export function PublicPropertyView(props: {
  property: PublicPropertyData;
  agent: PublicAgent;
  trackingRef: string | null;
  brandColor?: string | null;
}) {
  return props.property.premiumLanding ? (
    <ExclusiveView {...props} />
  ) : (
    <BasicView {...props} />
  );
}

// ============================================================
// BÁSICA — white-label single listing (light, contained)
// ============================================================

function BasicView({
  property,
  agent,
  trackingRef,
  brandColor,
}: {
  property: PublicPropertyData;
  agent: PublicAgent;
  trackingRef: string | null;
  brandColor?: string | null;
}) {
  const [mainIdx, setMainIdx] = useState(0);
  const photos = property.photos;
  const hasPhotos = photos.length > 0;
  const thumbs = photos.slice(1, 4);
  const extraCount = Math.max(0, photos.length - 4);

  const opLabel = OP_LABEL[property.operation] ?? property.operation;
  const catLabel = CAT_LABEL[property.category] ?? property.category;
  const place = property.location ?? property.address ?? "Rep. Dominicana";
  const priceLabel =
    property.operation === "EN_ALQUILER" || property.operation === "ALQUILADA"
      ? "Precio de alquiler"
      : "Precio de venta";
  const price =
    property.priceUSD != null
      ? formatPrice(property.priceUSD, "USD")
      : formatPrice(property.priceDOP, "DOP");

  const firstName = agent.name.split(" ")[0];
  const waMsg = `Hola ${firstName}, vi la propiedad "${property.title}" y me interesa. ¿Podrías darme más información?`;

  function scrollToLead() {
    document
      .getElementById("contact-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function scrollToGallery() {
    document
      .getElementById("galeria")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      style={brandVars(brandColor)}
      className="min-h-screen bg-white font-sans text-zinc-900"
    >
      {/* ===================== TOP BAR (agent brand) ===================== */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-[clamp(18px,4vw,32px)] py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--brand)] font-display text-lg font-bold text-white">
              {initials(agent.name).charAt(0)}
            </span>
            <div className="min-w-0">
              <div className="truncate font-display text-[15px] font-bold leading-tight">
                {agent.name}
              </div>
              <div className="truncate text-[11.5px] text-zinc-500">
                {agent.role ?? "Asesor inmobiliario"}
              </div>
            </div>
          </div>
          {agent.phone ? (
            <a
              href={waLink(agent.phone, waMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-700)]"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">Contactar</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={scrollToLead}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-700)]"
            >
              <Mail className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">Contactar</span>
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1120px] px-[clamp(18px,4vw,32px)] pb-20 pt-[clamp(20px,3vw,32px)]">
        {/* ===================== HEADER (breadcrumb + title + price) ===================== */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 flex flex-wrap items-end justify-between gap-4"
        >
          <div className="min-w-0">
            <div className="mb-2 text-[13px] text-zinc-500">
              {catLabel} · {place} · {opLabel}
            </div>
            <h1 className="text-[clamp(26px,3.4vw,40px)] font-bold leading-[1.05] tracking-tight">
              {property.title}
            </h1>
            <div className="mt-2 flex items-center gap-1.5 text-[15px] text-zinc-600">
              <MapPin className="h-4 w-4 text-[var(--brand)]" strokeWidth={2} />
              {place}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[13px] text-zinc-500">{priceLabel}</div>
            <div className="font-display text-[clamp(26px,3.4vw,38px)] font-bold tracking-tight tabular-nums">
              {price}
            </div>
            {property.priceUSD != null && property.priceDOP != null && (
              <div className="text-[13px] text-zinc-500 tabular-nums">
                {formatPrice(property.priceDOP, "DOP")}
              </div>
            )}
          </div>
        </motion.div>

        {/* ===================== GALLERY (main + thumbs) ===================== */}
        <div
          className={cn(
            "grid gap-3",
            thumbs.length > 0 ? "md:grid-cols-[1fr_280px]" : "grid-cols-1"
          )}
        >
          <div className="relative overflow-hidden rounded-[18px] bg-zinc-100">
            {hasPhotos ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[mainIdx]}
                alt={property.title}
                className="h-[clamp(300px,42vw,460px)] w-full object-cover"
              />
            ) : (
              <div className="flex h-[clamp(300px,42vw,460px)] items-center justify-center text-zinc-300">
                <Building2 className="h-16 w-16" strokeWidth={1.25} />
              </div>
            )}
            <span className="absolute left-4 top-4 rounded-full bg-[var(--brand)] px-3 py-1.5 font-display text-xs font-bold text-white">
              {opLabel}
            </span>
          </div>

          {thumbs.length > 0 && (
            <div className="grid grid-rows-3 gap-3">
              {thumbs.map((url, i) => {
                const idx = i + 1;
                const isLast = i === thumbs.length - 1;
                return (
                  <button
                    type="button"
                    key={url + idx}
                    onClick={() => setMainIdx(idx)}
                    className={cn(
                      "relative h-full min-h-[100px] overflow-hidden rounded-[14px] bg-zinc-100 outline-offset-2 transition-all",
                      mainIdx === idx &&
                        "outline outline-[3px] outline-[var(--brand)]"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {isLast && extraCount > 0 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToGallery();
                        }}
                        className="absolute inset-0 grid place-items-center bg-zinc-900/55 font-display text-[15px] font-bold text-white"
                      >
                        +{extraCount} fotos
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ===================== SPECS ROW ===================== */}
        <div className="mt-6 flex flex-wrap gap-3">
          {property.bedrooms != null && (
            <SpecPill
              icon={<Bed className="h-5 w-5" strokeWidth={1.75} />}
              value={String(property.bedrooms)}
              label="Habitaciones"
            />
          )}
          {property.bathrooms != null && (
            <SpecPill
              icon={<Bath className="h-5 w-5" strokeWidth={1.75} />}
              value={String(property.bathrooms)}
              label="Baños"
            />
          )}
          {property.metersSquared != null && (
            <SpecPill
              icon={<Ruler className="h-5 w-5" strokeWidth={1.75} />}
              value={`${property.metersSquared} m²`}
              label="Área"
            />
          )}
          {property.parking != null && (
            <SpecPill
              icon={<Car className="h-5 w-5" strokeWidth={1.75} />}
              value={String(property.parking)}
              label="Parqueos"
            />
          )}
          <SpecPill
            icon={<Layers className="h-5 w-5" strokeWidth={1.75} />}
            value={catLabel}
            label="Tipo"
          />
        </div>

        {/* ===================== BODY (content + sticky contact) ===================== */}
        <div className="mt-11 grid grid-cols-1 gap-9 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0">
            {property.description && (
              <section>
                <h2 className="text-2xl font-bold tracking-tight">
                  Descripción
                </h2>
                <p className="mt-3.5 whitespace-pre-line text-base leading-[1.7] text-zinc-600">
                  {property.description}
                </p>
              </section>
            )}

            {photos.length > 1 && (
              <section id="galeria" className="mt-11 scroll-mt-24">
                <h2 className="text-2xl font-bold tracking-tight">
                  Galería · {photos.length} fotos
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                  {photos.map((url, i) => (
                    <button
                      type="button"
                      key={url + i}
                      onClick={() => {
                        setMainIdx(i);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="group aspect-[4/3] overflow-hidden rounded-[14px] bg-zinc-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Foto ${i + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {property.lat != null && property.lng != null && (
              <section className="mt-11">
                <h2 className="text-2xl font-bold tracking-tight">Ubicación</h2>
                {property.pois.filter((p) => p.pinned).length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {property.pois
                      .filter((p) => p.pinned)
                      .map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: p.color ?? "var(--brand)" }}
                          />
                          {p.name}
                          {poiDistance(p) && (
                            <span className="text-[10px] text-zinc-400 tabular-nums">
                              · {poiDistance(p)}
                            </span>
                          )}
                        </span>
                      ))}
                  </div>
                )}
                <div className="mt-5 overflow-hidden rounded-[18px] border border-zinc-200">
                  <PropertyMap
                    property={{
                      id: property.id,
                      title: property.title,
                      location: property.location,
                      lat: property.lat,
                      lng: property.lng,
                    }}
                    pois={property.pois}
                    variant="full"
                  />
                </div>
              </section>
            )}
          </div>

          {/* Sticky contact card */}
          <aside>
            <div className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-[0_4px_14px_rgba(16,24,32,.07),0_2px_4px_rgba(16,24,32,.04)] lg:sticky lg:top-[88px]">
              <div className="flex items-center gap-3.5">
                {agent.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--brand)]/15 font-display text-lg font-bold text-[var(--brand-700)]">
                    {initials(agent.name)}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="truncate font-display text-[17px] font-bold leading-tight">
                    {agent.name}
                  </div>
                  <div className="truncate text-[13px] text-zinc-500">
                    {agent.role ?? "Asesor inmobiliario"}
                  </div>
                  {agent.location && (
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400">
                      <MapPin className="h-3 w-3" strokeWidth={2} />
                      <span className="truncate">{agent.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                {agent.phone && (
                  <a
                    href={waLink(agent.phone, waMsg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-700)]"
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={2} />
                    Escribir por WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  onClick={scrollToLead}
                  className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                >
                  <Calendar className="h-4 w-4" strokeWidth={2} />
                  Agendar visita
                </button>
                {agent.phone && (
                  <a
                    href={`tel:${agent.phone.replace(/[^\d+]/g, "")}`}
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    <Phone className="h-4 w-4" strokeWidth={2} />
                    Llamar ahora
                  </a>
                )}
                {agent.email && (
                  <a
                    href={`mailto:${agent.email}?subject=${encodeURIComponent(`Interés en ${property.title}`)}`}
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    <Mail className="h-4 w-4" strokeWidth={2} />
                    Enviar email
                  </a>
                )}
              </div>

              <div className="mt-[18px] flex flex-col gap-2.5 border-t border-zinc-200 pt-[18px] text-[13.5px] text-zinc-600">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--brand)]" strokeWidth={2.5} />
                  Respuesta en menos de 1 hora
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--brand)]" strokeWidth={2.5} />
                  Visitas presenciales y virtuales
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ===================== LEAD FORM ===================== */}
      <section
        id="contact-form"
        className="scroll-mt-20 border-y border-zinc-200 bg-zinc-50 py-16"
      >
        <div className="mx-auto max-w-3xl px-[clamp(18px,4vw,32px)]">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-700)]">
              Solicita información
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              ¿Te interesa esta propiedad?
            </h2>
            <p className="mx-auto mt-3 max-w-prose text-sm text-zinc-500 sm:text-base">
              Déjanos tu contacto y te escribimos para coordinar una visita o
              enviarte más información.
            </p>
          </div>
          <LeadForm slug={property.slug} trackingRef={trackingRef} />
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="bg-white py-8">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-[clamp(18px,4vw,32px)]">
          <span className="text-[13px] text-zinc-400">
            Propiedad publicada por {agent.name}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-zinc-400">
            Hecho con
            <span className="font-display font-bold text-zinc-900">
              estaila<span className="text-[var(--brand)]">.</span>
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// EXCLUSIVA — premium / dark / immersive
// ============================================================

function ExclusiveView({
  property,
  agent,
  trackingRef,
  brandColor,
}: {
  property: PublicPropertyData;
  agent: PublicAgent;
  trackingRef: string | null;
  brandColor?: string | null;
}) {
  const photos = property.photos;
  const hero = photos[0] ?? null;
  const featureImg = photos[1] ?? photos[0] ?? null;
  const mosaic = photos.slice(0, 7);

  const opLabel = OP_LABEL[property.operation] ?? property.operation;
  const catLabel = CAT_LABEL[property.category] ?? property.category;
  const place = property.location ?? property.address ?? "Rep. Dominicana";
  const priceLabel =
    property.operation === "EN_ALQUILER" || property.operation === "ALQUILADA"
      ? "Precio de alquiler"
      : "Precio bajo solicitud";
  const price =
    property.priceUSD != null
      ? formatPrice(property.priceUSD, "USD")
      : property.priceDOP != null
        ? formatPrice(property.priceDOP, "DOP")
        : "Bajo solicitud";

  const firstName = agent.name.split(" ")[0];
  const waMsg = `Hola ${firstName}, me interesa la propiedad "${property.title}". Quisiera coordinar una visita privada.`;
  const hasMap = property.lat != null && property.lng != null;
  const pinned = property.pois.filter((p) => p.pinned).slice(0, 3);

  const specs: [React.ReactNode, string, string][] = [];
  if (property.bedrooms != null)
    specs.push([
      <Bed key="bed" className="h-5 w-5" strokeWidth={1.75} />,
      String(property.bedrooms),
      property.bedrooms === 1 ? "Habitación" : "Habitaciones",
    ]);
  if (property.bathrooms != null)
    specs.push([
      <Bath key="bath" className="h-5 w-5" strokeWidth={1.75} />,
      String(property.bathrooms),
      "Baños",
    ]);
  if (property.metersSquared != null)
    specs.push([
      <Ruler key="ruler" className="h-5 w-5" strokeWidth={1.75} />,
      `${property.metersSquared} m²`,
      "Construcción",
    ]);
  if (property.parking != null)
    specs.push([
      <Car key="car" className="h-5 w-5" strokeWidth={1.75} />,
      String(property.parking),
      property.parking === 1 ? "Parqueo" : "Parqueos",
    ]);
  specs.push([
    <Layers key="type" className="h-5 w-5" strokeWidth={1.75} />,
    catLabel,
    "Tipo",
  ]);

  function scrollToLead() {
    document
      .getElementById("contact-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={brandVars(brandColor)} className="bg-[#0E0F11] font-sans text-white">
      {/* ===================== NAV (over hero) ===================== */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-[clamp(20px,4vw,40px)] py-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] border-[1.5px] border-[var(--brand)] font-display font-bold text-[var(--brand)]">
              {initials(agent.name).charAt(0)}
            </span>
            <span className="truncate font-display text-[15px] font-semibold uppercase tracking-[0.14em] sm:text-[17px]">
              {agent.name}
            </span>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-white/75 md:flex">
            {mosaic.length > 0 && (
              <a href="#ex-galeria" className="transition-colors hover:text-white">
                Galería
              </a>
            )}
            {hasMap && (
              <a
                href="#ex-ubicacion"
                className="transition-colors hover:text-white"
              >
                Ubicación
              </a>
            )}
            <a href="#contact-form" className="transition-colors hover:text-white">
              Contacto
            </a>
          </nav>
          <button
            type="button"
            onClick={scrollToLead}
            className="shrink-0 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Visita privada
          </button>
        </div>
      </header>

      {/* ===================== HERO (full-bleed) ===================== */}
      <section className="relative h-[100svh] min-h-[600px] w-full overflow-hidden">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero}
            alt={property.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[#16181b] text-white/15">
            <Building2 className="h-24 w-24" strokeWidth={1} />
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,15,17,.55)_0%,rgba(14,15,17,.1)_35%,rgba(14,15,17,.92)_100%)]" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-x-0 bottom-0 mx-auto max-w-[1240px] px-[clamp(20px,4vw,40px)] pb-[clamp(40px,6vw,72px)]"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3.5 py-1.5 font-display text-[12.5px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            {catLabel} exclusiva · {opLabel}
          </span>
          <h1 className="mt-5 max-w-[16ch] text-[clamp(40px,6.5vw,86px)] font-bold leading-[0.98] tracking-[-0.04em]">
            {property.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
            <div className="flex items-center gap-2 text-[17px] text-white/80">
              <MapPin className="h-[18px] w-[18px] text-[var(--brand)]" strokeWidth={2} />
              {place}
            </div>
            <div className="sm:ml-auto sm:text-right">
              <div className="text-[12.5px] uppercase tracking-[0.1em] text-white/50">
                {priceLabel}
              </div>
              <div className="font-display text-[clamp(28px,3.4vw,42px)] font-bold tracking-[-0.03em] tabular-nums">
                {price}
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <button
              type="button"
              onClick={scrollToLead}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--brand-700)]"
            >
              <Calendar className="h-[18px] w-[18px]" strokeWidth={2} />
              Solicitar visita privada
            </button>
            {agent.phone && (
              <a
                href={waLink(agent.phone, waMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-[15px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2} />
                WhatsApp
              </a>
            )}
          </div>
        </motion.div>
      </section>

      {/* ===================== SPECS BAND ===================== */}
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-6 px-[clamp(20px,4vw,40px)] py-[clamp(40px,5vw,64px)] sm:grid-cols-3 md:grid-cols-5">
          {specs.map(([icon, value, label]) => (
            <div key={label}>
              <span className="text-[var(--brand)]">{icon}</span>
              <div className="mt-2.5 font-display text-[clamp(20px,2vw,28px)] font-bold tracking-tight">
                {value}
              </div>
              <div className="text-[13px] text-white/50">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== FEATURE SPLIT ===================== */}
      {property.description && (
        <section className="mx-auto grid max-w-[1240px] items-center gap-[clamp(32px,5vw,72px)] px-[clamp(20px,4vw,40px)] py-[clamp(56px,8vw,110px)] md:grid-cols-2">
          <div>
            <span className="font-display text-[12.5px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
              La propiedad
            </span>
            <h2 className="mt-4 text-[clamp(30px,4vw,52px)] font-bold leading-[1.05] tracking-[-0.03em]">
              Diseñada para vivir distinto.
            </h2>
            <p className="mt-5 whitespace-pre-line text-[clamp(16px,1.3vw,18px)] leading-[1.7] text-white/65">
              {property.description}
            </p>
            {pinned.length > 0 && (
              <div className="mt-7 flex flex-col gap-3.5">
                {pinned.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 text-base">
                    <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-white/[0.06] text-[var(--brand)]">
                      <Check className="h-[15px] w-[15px]" strokeWidth={2.5} />
                    </span>
                    <span>
                      {p.name}
                      {poiDistance(p) && (
                        <span className="text-white/45"> · {poiDistance(p)}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {featureImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featureImg}
              alt={property.title}
              className="h-[clamp(360px,40vw,520px)] w-full rounded-[22px] object-cover"
            />
          ) : (
            <div className="grid h-[clamp(360px,40vw,520px)] w-full place-items-center rounded-[22px] bg-white/[0.04] text-white/15">
              <Building2 className="h-20 w-20" strokeWidth={1} />
            </div>
          )}
        </section>
      )}

      {/* ===================== GALLERY MOSAIC ===================== */}
      {mosaic.length > 0 && (
        <section
          id="ex-galeria"
          className="scroll-mt-20 border-y border-white/10 bg-[#121316]"
        >
          <div className="mx-auto max-w-[1240px] px-[clamp(20px,4vw,40px)] py-[clamp(56px,8vw,110px)]">
            <div className="mb-12 text-center">
              <span className="font-display text-[12.5px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                Galería
              </span>
              <h2 className="mt-3 text-[clamp(28px,3.6vw,46px)] font-bold tracking-[-0.03em]">
                Cada rincón, una postal.
              </h2>
            </div>
            <div className="grid auto-rows-[150px] grid-cols-2 gap-3 md:auto-rows-[200px] md:grid-cols-4">
              {mosaic.map((url, i) => (
                <div
                  key={url + i}
                  className={cn(
                    "overflow-hidden rounded-[16px] bg-white/[0.04]",
                    i === 0 && "col-span-2 row-span-2"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== UBICACIÓN ===================== */}
      {hasMap && (
        <section
          id="ex-ubicacion"
          className="mx-auto max-w-[1240px] scroll-mt-20 px-[clamp(20px,4vw,40px)] py-[clamp(56px,8vw,110px)]"
        >
          <span className="font-display text-[12.5px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            Ubicación
          </span>
          <h2 className="mt-3 text-[clamp(28px,3.6vw,46px)] font-bold tracking-[-0.03em]">
            {place}
          </h2>
          {property.pois.filter((p) => p.pinned).length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {property.pois
                .filter((p) => p.pinned)
                .map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: p.color ?? "var(--brand)" }}
                    />
                    {p.name}
                    {poiDistance(p) && (
                      <span className="text-[10px] text-white/45 tabular-nums">
                        · {poiDistance(p)}
                      </span>
                    )}
                  </span>
                ))}
            </div>
          )}
          <div className="mt-6 overflow-hidden rounded-[20px] border border-white/10">
            <PropertyMap
              property={{
                id: property.id,
                title: property.title,
                location: property.location,
                lat: property.lat,
                lng: property.lng,
              }}
              pois={property.pois}
              variant="full"
            />
          </div>
        </section>
      )}

      {/* ===================== PRIVATE VIEWING + LEAD FORM ===================== */}
      <section
        id="contact-form"
        className="scroll-mt-20 border-t border-white/10 bg-[#0E0F11]"
      >
        <div className="mx-auto grid max-w-[1240px] gap-[clamp(32px,5vw,64px)] px-[clamp(20px,4vw,40px)] py-[clamp(56px,8vw,110px)] lg:grid-cols-[1fr_minmax(0,520px)] lg:items-start">
          <div>
            <h2 className="text-[clamp(28px,3.4vw,46px)] font-bold leading-[1.05] tracking-[-0.03em]">
              Agenda una visita privada
            </h2>
            <p className="mt-4 max-w-[460px] text-[16.5px] leading-[1.6] text-white/60">
              Coordinamos una experiencia personalizada, presencial o virtual,
              con total discreción.
            </p>

            <div className="mt-8 flex items-center gap-4">
              {agent.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-white/10"
                />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white/[0.06] font-display text-lg font-bold text-[var(--brand)]">
                  {initials(agent.name)}
                </span>
              )}
              <div className="min-w-0">
                <div className="truncate font-display text-base font-semibold">
                  {agent.name}
                </div>
                <div className="truncate text-[13px] text-white/50">
                  {agent.role ?? "Asesor inmobiliario"}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {agent.phone && (
                <a
                  href={waLink(agent.phone, waMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-700)]"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2} />
                  WhatsApp
                </a>
              )}
              {agent.phone && (
                <a
                  href={`tel:${agent.phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" strokeWidth={2} />
                  Llamar
                </a>
              )}
              {agent.email && (
                <a
                  href={`mailto:${agent.email}?subject=${encodeURIComponent(`Interés en ${property.title}`)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  <Mail className="h-4 w-4" strokeWidth={2} />
                  Email
                </a>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-2.5 text-[14px] text-white/60">
              <span className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[var(--brand)]" strokeWidth={2} />
                Atención presencial y virtual
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--brand)]" strokeWidth={2.5} />
                Total discreción y confidencialidad
              </span>
            </div>
          </div>

          <LeadForm
            slug={property.slug}
            trackingRef={trackingRef}
            tone="dark"
          />
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-[clamp(20px,4vw,40px)] py-7">
          <span className="text-[13px] text-white/40">
            Propiedad publicada por {agent.name}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-white/40">
            Hecho con
            <span className="font-display font-bold text-white">
              estaila<span className="text-[var(--brand)]">.</span>
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// SPEC PILL (Básica)
// ============================================================

function SpecPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,32,.05)]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-50 text-[var(--brand)]">
        {icon}
      </span>
      <div>
        <div className="font-display text-lg font-bold leading-none tracking-tight">
          {value}
        </div>
        <div className="mt-1 text-xs text-zinc-500">{label}</div>
      </div>
    </div>
  );
}

// ============================================================
// LEAD FORM (tone-aware: light | dark)
// ============================================================

function LeadForm({
  slug,
  trackingRef,
  tone = "light",
}: {
  slug: string;
  trackingRef: string | null;
  tone?: "light" | "dark";
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // bot trap
  const [done, setDone] = useState(false);

  const dark = tone === "dark";
  const inputCls = dark
    ? "border-white/15 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-white/25"
    : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Por favor escribe tu nombre");
      return;
    }
    if (!whatsapp.trim() && !email.trim()) {
      toast.error("Necesitamos WhatsApp o email para contactarte");
      return;
    }
    startTransition(async () => {
      try {
        await submitPublicLead({
          slug,
          name: name.trim(),
          whatsapp: whatsapp.trim() || undefined,
          email: email.trim() || undefined,
          message: message.trim() || undefined,
          trackingId: trackingRef ?? undefined,
          honeypot,
        });
        setDone(true);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl border p-10 text-center",
          dark
            ? "border-[var(--brand)]/30 bg-[var(--brand)]/10 text-white"
            : "mt-10 border-[var(--brand)]/30 bg-[var(--brand)]/10"
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-white">
          <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
        </span>
        <h3 className="text-2xl font-bold tracking-tight">
          ¡Gracias por tu interés!
        </h3>
        <p
          className={cn(
            "max-w-prose text-sm",
            dark ? "text-white/60" : "text-zinc-500"
          )}
        >
          Recibimos tu mensaje. Te contactaremos en breve por el canal que
          dejaste.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "rounded-2xl border p-6 sm:p-8",
        dark
          ? "border-white/10 bg-white/[0.03]"
          : "mt-8 border-zinc-200 bg-white shadow-[0_4px_14px_rgba(16,24,32,.07)]"
      )}
    >
      {/* Honeypot — invisible to humans, bots fill it */}
      <input
        type="text"
        name="website_url"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="sr-only"
        aria-hidden
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tu nombre *" tone={tone} className="sm:col-span-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="María Rodríguez"
            required
            maxLength={120}
            className={inputCls}
          />
        </Field>
        <Field label="WhatsApp / Teléfono" tone={tone}>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+1 555 0100"
            type="tel"
            className={inputCls}
          />
        </Field>
        <Field label="Email" tone={tone}>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            type="email"
            className={inputCls}
          />
        </Field>
        <Field label="Mensaje (opcional)" tone={tone} className="sm:col-span-2">
          <Textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuándo te gustaría visitar, qué necesitas saber..."
            className={inputCls}
          />
        </Field>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-[11px]", dark ? "text-white/40" : "text-zinc-400")}>
          No compartimos tu información. Solo para contactarte sobre esta
          propiedad.
        </p>
        <Button
          type="submit"
          disabled={pending}
          size="lg"
          className="bg-[var(--brand)] text-white hover:bg-[var(--brand-700)]"
        >
          {pending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-1.5 h-4 w-4" />
          )}
          Enviar
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
  tone = "light",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wider",
          tone === "dark" ? "text-white/55" : "text-zinc-500"
        )}
      >
        {label}
      </Label>
      {children}
    </div>
  );
}
