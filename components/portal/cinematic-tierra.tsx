"use client";

/**
 * TIERRA CARIBE — Property landing
 *
 * Editorial cartographic showcase for single property pages.
 * Replaces the heavier Cinematic showcase. Uses the same data shape.
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Phone, Mail } from "lucide-react";
import { LanguageProvider, useLang } from "@/components/marketing-site/language-context";
import { useTierra } from "@/lib/tierra-i18n";
import {
  Coord,
  EdgeTicks,
  MiniMap,
  NorthArrow,
  Reveal,
  SectionLabel,
  Sun,
  WaveDivider,
} from "@/components/tierra/atoms";
import { TierraLangToggle, TierraThemeToggle } from "@/components/tierra/toggles";
import type { LuxuryAgent, LuxuryProperty, LuxurySite } from "./cinematic-showcase";

function parseJSON<T>(v: string | null | undefined, fallback: T): T {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export function CinematicTierra(props: {
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
  const t = useTierra(lang);

  const price = property.priceUSD
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(property.priceUSD)
    : null;

  const hero = photos[0] ?? property.featuredPhoto ?? null;
  const rest = photos.slice(1);

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
  const nearbyPois = parseJSON<{ name: string; distance?: string }[]>(
    property.nearbyPois ?? null,
    []
  );
  const floorPlans = parseJSON<{ type: string; beds?: number; baths?: number; sqm?: number; url?: string }[]>(
    property.floorPlans ?? null,
    []
  );

  // Pseudo coordinate from title hash
  const coordSeed = (property.location ?? property.title).length;
  const lat = property.lat ?? 18 + ((coordSeed * 0.13) % 1);
  const lng = property.lng ?? -(69 + ((coordSeed * 0.17) % 1));

  const categoryLabel: Record<string, string> = lang === "es"
    ? { CASA: "Casa", APARTAMENTO: "Apartamento", VILLA: "Villa", LOCAL: "Local", OFICINA: "Oficina", SOLAR: "Solar", PENTHOUSE: "Penthouse" }
    : { CASA: "House", APARTAMENTO: "Apartment", VILLA: "Villa", LOCAL: "Retail", OFICINA: "Office", SOLAR: "Lot", PENTHOUSE: "Penthouse" };
  const operationLabel: Record<string, string> = lang === "es"
    ? { EN_VENTA: "Venta", EN_ALQUILER: "Alquiler", VENDIDA: "Vendida", ALQUILADA: "Alquilada" }
    : { EN_VENTA: "Sale", EN_ALQUILER: "Rental", VENDIDA: "Sold", ALQUILADA: "Rented" };

  return (
    <div className="tierra tierra-grain relative min-h-screen overflow-hidden">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-current/15 bg-[var(--tierra-bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-3 md:px-10">
          <Link href={`/p/${site.slug}`} className="flex items-center gap-3">
            <NorthArrow size={28} />
            <div className="flex flex-col leading-none">
              <span className="tierra-mono text-[10px] font-semibold uppercase tracking-[0.22em]">
                {site.title ?? agent.name}
              </span>
              <span
                className="tierra-display mt-0.5 text-[11px] italic opacity-70"
                style={{ fontVariationSettings: "'opsz' 12" }}
              >
                ← {lang === "es" ? "volver al catálogo" : "back to catalog"}
              </span>
            </div>
          </Link>
          <div className="hidden md:block">
            <Coord>{lang === "es" ? "FICHA Nº" : "ENTRY N°"} {property.id.slice(-6).toUpperCase()}</Coord>
          </div>
          <div className="flex items-center gap-2">
            <TierraLangToggle />
            <TierraThemeToggle className="hidden sm:inline-flex" />
            {site.whatsapp && (
              <a
                href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="tierra-btn"
              >
                {t.property.labels.request}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Coordinate strip */}
      <div className="border-b border-current/10 bg-[var(--tierra-surface)]/40">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-8 overflow-x-auto px-6 py-2 md:px-10">
          <div className="flex items-center gap-6">
            <Coord>
              <span className="opacity-50">LAT</span>
              {lat.toFixed(4)}° N
            </Coord>
            <Coord>
              <span className="opacity-50">LNG</span>
              {Math.abs(lng).toFixed(4)}° W
            </Coord>
            <Coord className="hidden md:inline-flex">
              <span className="opacity-50">SCALE</span>
              1:5,000
            </Coord>
          </div>
          <Coord>EDITION I · 2026</Coord>
        </div>
      </div>

      {/* HERO */}
      <section className="relative px-6 pb-20 pt-12 md:px-10 md:pt-16">
        <div className="absolute right-6 top-16 hidden opacity-40 md:block">
          <Sun size={120} className="text-[var(--tierra-amber)]" />
        </div>

        <div className="mx-auto max-w-[1500px]">
          <Reveal>
            <div className="flex items-baseline gap-3">
              <Coord>{t.property.sections.overview.toUpperCase()} · 01</Coord>
              <span className="h-px flex-1 bg-current/30" />
              <Coord className="opacity-60">
                {categoryLabel[property.category] ?? property.category} ·{" "}
                {operationLabel[property.operation] ?? property.operation}
              </Coord>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="mt-10">
            <h1
              className="tierra-display text-[clamp(48px,9vw,160px)] font-light leading-[0.92] tracking-[-0.03em]"
              style={{ fontVariationSettings: "'opsz' 160" }}
            >
              {property.title}
              <span
                className="italic text-[var(--tierra-primary)]"
                style={{ fontVariationSettings: "'opsz' 160, 'SOFT' 100" }}
              >
                .
              </span>
            </h1>
          </Reveal>

          {property.location && (
            <Reveal delay={0.25} className="mt-4">
              <p
                className="tierra-display text-2xl italic opacity-70"
                style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 100" }}
              >
                {property.location}
              </p>
            </Reveal>
          )}

          {/* Hero image + metadata */}
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <Reveal delay={0.3} className="lg:col-span-8">
              <div className="relative aspect-[16/10] overflow-hidden border border-current/20">
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
                  <div className="flex h-full items-center justify-center bg-[var(--tierra-surface)]">
                    <NorthArrow size={120} className="text-[var(--tierra-primary)] opacity-40" />
                  </div>
                )}
                <EdgeTicks className="text-[var(--tierra-bg)]" />
              </div>
            </Reveal>

            <Reveal delay={0.4} className="lg:col-span-4">
              <div className="relative h-full border border-current/20 bg-[var(--tierra-surface)]/40 p-8">
                <EdgeTicks />
                <Coord className="opacity-60">FICHA TÉCNICA</Coord>
                <dl className="mt-6 space-y-4 divide-y divide-current/10">
                  <SpecRow label={t.property.labels.type} value={categoryLabel[property.category] ?? property.category} />
                  {property.metersSquared && (
                    <SpecRow label={t.property.labels.area} value={`${property.metersSquared} m²`} />
                  )}
                  {property.bedrooms !== null && property.bedrooms > 0 && (
                    <SpecRow label={t.property.labels.bedrooms} value={String(property.bedrooms)} />
                  )}
                  {property.bathrooms !== null && property.bathrooms !== undefined && (
                    <SpecRow label={t.property.labels.bathrooms} value={String(property.bathrooms)} />
                  )}
                  {property.parking !== null && property.parking !== undefined && property.parking > 0 && (
                    <SpecRow label={t.property.labels.parking} value={String(property.parking)} />
                  )}
                </dl>
                <div className="mt-8 border-t border-current/15 pt-6">
                  {price ? (
                    <>
                      <Coord className="opacity-60">{t.property.labels.price.toUpperCase()}</Coord>
                      <p
                        className="tierra-display mt-2 text-4xl font-light tabular-nums tracking-tight"
                        style={{ fontVariationSettings: "'opsz' 48" }}
                      >
                        {price}
                      </p>
                    </>
                  ) : (
                    <Coord className="opacity-60">
                      {lang === "es" ? "Precio a solicitud" : "Price on request"}
                    </Coord>
                  )}
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  {site.whatsapp && (
                    <a
                      href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="tierra-btn w-full"
                    >
                      <MessageCircle className="h-3 w-3" strokeWidth={1.5} />
                      {t.property.labels.request}
                    </a>
                  )}
                  {site.phone && (
                    <a href={`tel:${site.phone.replace(/\D/g, "")}`} className="tierra-btn tierra-btn--ghost w-full">
                      <Phone className="h-3 w-3" strokeWidth={1.5} />
                      {site.phone}
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Description */}
      {property.description && (
        <section className="relative border-t border-current/15 px-6 py-20 md:px-10 md:py-24">
          <div className="mx-auto max-w-[1500px]">
            <div className="grid grid-cols-12 gap-8">
              <Reveal className="col-span-12 lg:col-span-4">
                <SectionLabel n="02" label={t.property.sections.overview.toUpperCase()} total="06" />
                <p
                  className="tierra-display mt-8 text-[clamp(36px,5vw,72px)] font-light leading-[0.96] tracking-[-0.025em]"
                  style={{ fontVariationSettings: "'opsz' 72" }}
                >
                  {lang === "es" ? "Vista" : "Over"}
                  <br />
                  <span
                    className="italic text-[var(--tierra-primary)]"
                    style={{ fontVariationSettings: "'opsz' 72, 'SOFT' 100" }}
                  >
                    {lang === "es" ? "general" : "view"}
                  </span>
                </p>
              </Reveal>
              <Reveal delay={0.15} className="col-span-12 lg:col-span-8">
                <div className="relative">
                  <span
                    className="tierra-display absolute -left-4 -top-8 text-7xl italic text-[var(--tierra-primary)]"
                    style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 100" }}
                  >
                    {String.fromCharCode(8220)}
                  </span>
                  <p className="text-lg leading-relaxed opacity-85 md:text-xl">
                    {property.description}
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {rest.length > 0 && (
        <section className="relative border-t border-current/15 bg-[var(--tierra-surface)]/30 px-6 py-20 md:px-10 md:py-24">
          <div className="mx-auto max-w-[1500px]">
            <SectionLabel n="03" label={t.property.sections.gallery.toUpperCase()} total="06" className="mb-12" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((photo, i) => (
                <Reveal key={i} delay={Math.min(i, 8) * 0.05}>
                  <div className="group relative aspect-[4/3] overflow-hidden border border-current/15">
                    <Image
                      src={photo}
                      alt={`${property.title} — ${i + 2}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute left-2 top-2">
                      <Coord className="bg-[var(--tierra-bg)]/80 px-1.5 py-0.5 backdrop-blur-sm">
                        {String(i + 2).padStart(2, "0")}
                      </Coord>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Amenities + Finishes */}
      {(amenities.length > 0 || finishes.length > 0) && (
        <section className="relative border-t border-current/15 px-6 py-20 md:px-10 md:py-24">
          <div className="mx-auto max-w-[1500px] grid grid-cols-12 gap-8">
            <Reveal className="col-span-12 lg:col-span-4">
              <SectionLabel n="04" label={t.property.sections.materials.toUpperCase()} total="06" />
              <p
                className="tierra-display mt-8 text-[clamp(36px,5vw,72px)] font-light leading-[0.96] tracking-[-0.025em]"
                style={{ fontVariationSettings: "'opsz' 72" }}
              >
                {lang === "es" ? "Materiales" : "Materials"}
                <br />
                <span
                  className="italic text-[var(--tierra-primary)]"
                  style={{ fontVariationSettings: "'opsz' 72, 'SOFT' 100" }}
                >
                  & amenidades
                </span>
              </p>
            </Reveal>
            <div className="col-span-12 grid grid-cols-2 gap-px border border-current/15 bg-current/15 lg:col-span-8 md:grid-cols-3">
              {[...amenities, ...finishes.map((f) => ({ key: f, custom: undefined }))].map(
                (item, i) => (
                  <Reveal key={i} delay={Math.min(i, 8) * 0.03}>
                    <div className="h-full bg-[var(--tierra-bg)] p-5">
                      <Coord className="opacity-50">{String(i + 1).padStart(2, "0")}</Coord>
                      <p
                        className="tierra-display mt-2 text-xl font-medium leading-tight"
                        style={{ fontVariationSettings: "'opsz' 20" }}
                      >
                        {item.custom ?? amenityLabel(item.key, lang)}
                      </p>
                    </div>
                  </Reveal>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* Floor plans */}
      {floorPlans.length > 0 && (
        <section className="relative border-t border-current/15 bg-[var(--tierra-surface)]/30 px-6 py-20 md:px-10 md:py-24">
          <div className="mx-auto max-w-[1500px]">
            <SectionLabel n="05" label={t.property.sections.floorplan.toUpperCase()} total="06" className="mb-12" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {floorPlans.map((plan, i) => (
                <Reveal key={i} delay={Math.min(i, 8) * 0.05}>
                  <div className="border border-current/20 bg-[var(--tierra-bg)] p-6">
                    <Coord className="opacity-60">PLAN {String(i + 1).padStart(2, "0")}</Coord>
                    <p
                      className="tierra-display mt-2 text-2xl font-medium"
                      style={{ fontVariationSettings: "'opsz' 24" }}
                    >
                      {plan.type}
                    </p>
                    <div className="mt-4 flex gap-4 border-t border-current/15 pt-3 text-xs">
                      {plan.beds !== undefined && <Coord>{plan.beds} {lang === "es" ? "hab" : "bd"}</Coord>}
                      {plan.baths !== undefined && <Coord>{plan.baths} {lang === "es" ? "baños" : "ba"}</Coord>}
                      {plan.sqm !== undefined && <Coord>{plan.sqm} m²</Coord>}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Location + nearby */}
      <section className="relative border-t border-current/15 px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1500px] grid grid-cols-12 gap-8">
          <Reveal className="col-span-12 lg:col-span-4">
            <SectionLabel n="06" label={t.property.sections.location.toUpperCase()} total="06" />
            <p
              className="tierra-display mt-8 text-[clamp(36px,5vw,72px)] font-light leading-[0.96] tracking-[-0.025em]"
              style={{ fontVariationSettings: "'opsz' 72" }}
            >
              {lang === "es" ? "Ubicación" : "Where"}
              <br />
              <span
                className="italic text-[var(--tierra-primary)]"
                style={{ fontVariationSettings: "'opsz' 72, 'SOFT' 100" }}
              >
                & entorno
              </span>
            </p>
            <div className="mt-8 space-y-1">
              <Coord>LAT {lat.toFixed(4)}° N</Coord>
              <br />
              <Coord>LNG {Math.abs(lng).toFixed(4)}° W</Coord>
            </div>
            {property.address && (
              <p className="mt-6 max-w-[36ch] text-sm leading-relaxed opacity-80">
                {property.address}
              </p>
            )}
          </Reveal>
          <Reveal delay={0.15} className="col-span-12 lg:col-span-8">
            <div className="relative aspect-[16/9] overflow-hidden border border-current/20 bg-[var(--tierra-surface)] tierra-contour">
              <div className="absolute inset-0 flex items-center justify-center">
                <MiniMap
                  size={280}
                  seed={coordSeed}
                  className="text-[var(--tierra-primary)]"
                />
              </div>
              {property.mapsUrl && (
                <a
                  href={property.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tierra-btn absolute bottom-4 right-4"
                >
                  {lang === "es" ? "Abrir en mapas" : "Open in Maps"} <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
            {nearbyPois.length > 0 && (
              <div className="mt-8 grid grid-cols-1 gap-px border border-current/15 bg-current/15 md:grid-cols-2">
                {nearbyPois.slice(0, 6).map((poi, i) => (
                  <div key={i} className="bg-[var(--tierra-bg)] p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium">{poi.name}</p>
                      {poi.distance && (
                        <Coord className="opacity-60">{poi.distance}</Coord>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="relative overflow-hidden border-t border-current/15 bg-[var(--tierra-ink)] text-[var(--tierra-bg)] px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1500px] grid grid-cols-12 gap-8">
          <Reveal className="col-span-12 lg:col-span-7">
            <SectionLabel
              n="07"
              label={t.property.sections.contact.toUpperCase()}
              className="border-current/40 text-[var(--tierra-bg)]"
            />
            <h2
              className="tierra-display mt-8 text-[clamp(40px,8vw,120px)] font-light leading-[0.92] tracking-[-0.03em]"
              style={{ fontVariationSettings: "'opsz' 120" }}
            >
              {lang === "es" ? "Agenda" : "Schedule"}
              <br />
              <span
                className="italic text-[var(--tierra-amber)]"
                style={{ fontVariationSettings: "'opsz' 120, 'SOFT' 100" }}
              >
                {lang === "es" ? "una visita" : "a visit"}
              </span>
            </h2>
            <p className="mt-6 max-w-[40ch] text-base leading-relaxed opacity-75 md:text-lg">
              {lang === "es"
                ? `Conversa directo con ${agent.name}. WhatsApp o llamada, hoy mismo.`
                : `Talk directly with ${agent.name}. WhatsApp or phone, same day.`}
            </p>
          </Reveal>
          <Reveal delay={0.15} className="col-span-12 lg:col-span-5">
            <ul className="border border-current/20 divide-y divide-current/15">
              {site.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                      lang === "es"
                        ? `Hola, me interesa ${property.title}.`
                        : `Hi, I'm interested in ${property.title}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between p-5 transition-colors hover:bg-[var(--tierra-bg)] hover:text-[var(--tierra-ink)]"
                  >
                    <div>
                      <Coord className="opacity-60">WHATSAPP</Coord>
                      <p
                        className="tierra-display mt-1 text-xl font-medium"
                        style={{ fontVariationSettings: "'opsz' 20" }}
                      >
                        {site.whatsapp}
                      </p>
                    </div>
                    <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
                  </a>
                </li>
              )}
              {site.email && (
                <li>
                  <a
                    href={`mailto:${site.email}?subject=${encodeURIComponent(property.title)}`}
                    className="group flex items-center justify-between p-5 transition-colors hover:bg-[var(--tierra-bg)] hover:text-[var(--tierra-ink)]"
                  >
                    <div>
                      <Coord className="opacity-60">EMAIL</Coord>
                      <p
                        className="tierra-display mt-1 text-xl font-medium"
                        style={{ fontVariationSettings: "'opsz' 20" }}
                      >
                        {site.email}
                      </p>
                    </div>
                    <Mail className="h-5 w-5" strokeWidth={1.5} />
                  </a>
                </li>
              )}
              {site.phone && (
                <li>
                  <a
                    href={`tel:${site.phone.replace(/\D/g, "")}`}
                    className="group flex items-center justify-between p-5 transition-colors hover:bg-[var(--tierra-bg)] hover:text-[var(--tierra-ink)]"
                  >
                    <div>
                      <Coord className="opacity-60">TEL</Coord>
                      <p
                        className="tierra-display mt-1 text-xl font-medium"
                        style={{ fontVariationSettings: "'opsz' 20" }}
                      >
                        {site.phone}
                      </p>
                    </div>
                    <Phone className="h-5 w-5" strokeWidth={1.5} />
                  </a>
                </li>
              )}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-[var(--tierra-surface)]/40">
        <WaveDivider />
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-6 py-6 md:px-10">
          <Coord className="opacity-60">
            © {new Date().getFullYear()} · {agent.name.toUpperCase()}
          </Coord>
          <Coord className="opacity-60">
            FICHA Nº {property.id.slice(-6).toUpperCase()} · {t.footer.version}
          </Coord>
          <div className="flex items-center gap-2">
            <TierraLangToggle />
            <TierraThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between pt-3">
      <Coord className="opacity-60">{label}</Coord>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function amenityLabel(key: string, lang: "es" | "en"): string {
  const ES: Record<string, string> = {
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
  const EN: Record<string, string> = {
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
  const map = lang === "es" ? ES : EN;
  return map[key] ?? key.replace(/_/g, " ").toLowerCase();
}
