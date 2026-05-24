"use client";

/**
 * TIERRA CARIBE — Agent portal /p/[slug]
 *
 * Same editorial cartographic language as the marketing landing,
 * scoped to the agent's catalog of properties.
 */

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Phone, Mail, MessageCircle } from "lucide-react";
import { LanguageProvider, useLang } from "@/components/marketing-site/language-context";
import { useTierra } from "@/lib/tierra-i18n";
import {
  Coord,
  EdgeTicks,
  MiniMap,
  NorthArrow,
  PalmFrond,
  Reveal,
  SectionLabel,
  Sun,
  WaveDivider,
} from "@/components/tierra/atoms";
import { TierraLangToggle, TierraThemeToggle } from "@/components/tierra/toggles";
import type { PortalData } from "../types";

export function AgentPortalTierra(props: PortalData) {
  return (
    <LanguageProvider>
      <PortalContent {...props} />
    </LanguageProvider>
  );
}

function PortalContent({ site, agent, properties }: PortalData) {
  const { lang } = useLang();
  const t = useTierra(lang);

  const firstName = (agent.name ?? "").split(/\s+/)[0] || agent.name;
  const initials = (agent.name ?? "—")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  // Active properties (exclude vendida/alquilada)
  const active = properties.filter(
    (p) => p.status !== "VENDIDA" && p.status !== "ALQUILADA"
  );
  const otherCount = properties.length - active.length;

  return (
    <div className="tierra tierra-grain relative min-h-screen overflow-hidden">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-current/15 bg-[var(--tierra-bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3 md:px-10">
          <Link href={`/p/${site.slug}`} className="flex items-center gap-3">
            {site.logoUrl ? (
              <Image
                src={site.logoUrl}
                alt={agent.name}
                width={32}
                height={32}
                className="rounded"
              />
            ) : (
              <NorthArrow size={32} />
            )}
            <div className="flex flex-col leading-none">
              <span className="tierra-mono text-[10px] font-semibold uppercase tracking-[0.22em]">
                {site.title ?? agent.name}
              </span>
              <span
                className="tierra-display mt-0.5 text-[11px] italic opacity-70"
                style={{ fontVariationSettings: "'opsz' 12" }}
              >
                {t.brand.sub}
              </span>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#catalog" className="tierra-mono text-[10px] font-medium uppercase tracking-[0.18em]">
              <span className="tierra-link">{t.portal.sections.catalog}</span>
            </a>
            <a href="#manifesto" className="tierra-mono text-[10px] font-medium uppercase tracking-[0.18em]">
              <span className="tierra-link">{t.portal.sections.manifesto}</span>
            </a>
            <a href="#contact" className="tierra-mono text-[10px] font-medium uppercase tracking-[0.18em]">
              <span className="tierra-link">{t.portal.sections.contact}</span>
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <TierraLangToggle />
            <TierraThemeToggle className="hidden sm:inline-flex" />
          </div>
        </div>
      </header>

      {/* Ticker */}
      <div className="border-b border-current/10 bg-[var(--tierra-surface)]/40">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-8 overflow-x-auto px-6 py-2 md:px-10">
          <div className="flex items-center gap-6">
            <Coord>
              <span className="opacity-50">PORTAL</span>
              {site.slug.toUpperCase()}
            </Coord>
            <Coord className="hidden md:inline-flex">
              <span className="opacity-50">ENTRIES</span>
              {active.length} / {properties.length}
            </Coord>
          </div>
          <Coord className="opacity-60">{t.brand.tagline}</Coord>
        </div>
      </div>

      {/* HERO */}
      <section className="relative px-6 pb-24 pt-14 md:px-10 md:pt-20">
        <div className="absolute right-6 top-12 hidden opacity-40 md:block">
          <Sun size={140} className="text-[var(--tierra-amber)]" />
        </div>
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            <Reveal>
              <Coord>{t.portal.hero.kicker}</Coord>
            </Reveal>
            <Reveal delay={0.15}>
              <h1
                className="tierra-display mt-8 text-[clamp(48px,9vw,140px)] font-light leading-[0.92] tracking-[-0.03em]"
                style={{ fontVariationSettings: "'opsz' 144" }}
              >
                {t.portal.hero.intro}{" "}
                <span
                  className="italic text-[var(--tierra-primary)]"
                  style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100" }}
                >
                  {firstName}
                </span>
                ,
                <br />
                {t.portal.hero.outro}
              </h1>
            </Reveal>
            {site.tagline && (
              <Reveal delay={0.35} className="mt-10 max-w-[60ch]">
                <p className="text-lg leading-relaxed opacity-80 md:text-xl">
                  {site.tagline}
                </p>
              </Reveal>
            )}
            <Reveal delay={0.5} className="mt-12 flex flex-wrap items-center gap-3">
              <a href="#catalog" className="tierra-btn">
                {t.portal.sections.catalog} <ArrowUpRight className="h-3 w-3" />
              </a>
              <a href="#contact" className="tierra-btn tierra-btn--ghost">
                {t.portal.sections.contact}
              </a>
            </Reveal>
          </div>

          {/* Agent card */}
          <Reveal delay={0.3} className="relative lg:col-span-4">
            <div className="relative border border-current/20 bg-[var(--tierra-surface)]/40 p-8">
              <EdgeTicks />
              <div className="flex items-start justify-between">
                <Coord className="opacity-60">AGENTE</Coord>
                <Coord className="opacity-60">FIG. 01</Coord>
              </div>
              <div className="mt-6 flex items-center gap-4">
                {agent.image ? (
                  <Image
                    src={agent.image}
                    alt={agent.name}
                    width={72}
                    height={72}
                    className="h-18 w-18 rounded-full border border-current/20 object-cover"
                  />
                ) : (
                  <div className="tierra-display flex h-16 w-16 items-center justify-center rounded-full border border-current/30 bg-[var(--tierra-bg)] text-2xl font-light italic text-[var(--tierra-primary)]">
                    {initials}
                  </div>
                )}
                <div>
                  <p
                    className="tierra-display text-2xl font-medium leading-tight"
                    style={{ fontVariationSettings: "'opsz' 24" }}
                  >
                    {agent.name}
                  </p>
                  <Coord className="opacity-60">ESTAILA × TIERRA</Coord>
                </div>
              </div>
              <MiniMap
                size={120}
                seed={agent.name.length}
                className="mx-auto mt-6 block text-[var(--tierra-primary)]"
              />
              <div className="mt-6 space-y-1.5 border-t border-current/15 pt-4 text-xs">
                {site.phone && (
                  <p className="flex items-center gap-2 opacity-80">
                    <Phone className="h-3 w-3" strokeWidth={1.5} />
                    <span className="tierra-mono tabular-nums">{site.phone}</span>
                  </p>
                )}
                {site.email && (
                  <p className="flex items-center gap-2 opacity-80">
                    <Mail className="h-3 w-3" strokeWidth={1.5} />
                    <span className="tierra-mono">{site.email}</span>
                  </p>
                )}
                {site.whatsapp && (
                  <p className="flex items-center gap-2 opacity-80">
                    <MessageCircle className="h-3 w-3" strokeWidth={1.5} />
                    <span className="tierra-mono tabular-nums">{site.whatsapp}</span>
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </div>
        <div className="mt-16 border-t border-current/15">
          <WaveDivider className="opacity-50" />
        </div>
      </section>

      {/* CATALOG */}
      <section id="catalog" className="relative px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-12 gap-8">
            <Reveal className="col-span-12 lg:col-span-3">
              <SectionLabel n="04" label="ARCHIVO" total={String(active.length).padStart(2, "0")} />
              <p
                className="tierra-display mt-8 text-[clamp(40px,5vw,72px)] font-light italic leading-none tracking-tight text-[var(--tierra-primary)]"
                style={{ fontVariationSettings: "'opsz' 72, 'SOFT' 100" }}
              >
                {active.length}
              </p>
              <p className="mt-3 max-w-[24ch] text-sm leading-relaxed opacity-75">
                {lang === "es"
                  ? otherCount > 0
                    ? `Propiedades activas. ${otherCount} cerradas en el último año.`
                    : "Propiedades activas en el territorio."
                  : otherCount > 0
                  ? `Active properties. ${otherCount} closed in the last year.`
                  : "Active properties in the territory."}
              </p>
              <div className="mt-10">
                <PalmFrond size={180} className="text-[var(--tierra-primary)] opacity-50" />
              </div>
            </Reveal>

            <div className="col-span-12 lg:col-span-9">
              {active.length === 0 ? (
                <Reveal>
                  <div className="border border-dashed border-current/30 p-16 text-center">
                    <Coord className="opacity-60">EMPTY</Coord>
                    <p
                      className="tierra-display mt-4 text-3xl font-light italic"
                      style={{ fontVariationSettings: "'opsz' 36, 'SOFT' 100" }}
                    >
                      {lang === "es" ? "Catálogo en preparación" : "Catalog in preparation"}
                    </p>
                  </div>
                </Reveal>
              ) : (
                <div className="border-t border-current/30">
                  {active.map((p, i) => (
                    <PortalPropertyRow
                      key={p.id}
                      property={p}
                      index={i}
                      slug={site.slug}
                      lang={lang}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO / ABOUT */}
      {site.about && (
        <section
          id="manifesto"
          className="relative border-t border-current/15 bg-[var(--tierra-surface)]/30 px-6 py-24 md:px-10 md:py-32"
        >
          <div className="mx-auto max-w-[1400px]">
            <div className="grid grid-cols-12 gap-8">
              <Reveal className="col-span-12 lg:col-span-4">
                <SectionLabel n="05" label="SOBRE MÍ" total="06" />
                <p
                  className="tierra-display mt-8 text-[clamp(40px,6vw,84px)] font-light leading-[0.96] tracking-[-0.025em]"
                  style={{ fontVariationSettings: "'opsz' 84" }}
                >
                  {lang === "es" ? "Mi" : "My"}
                  <br />
                  <span
                    className="italic text-[var(--tierra-primary)]"
                    style={{ fontVariationSettings: "'opsz' 84, 'SOFT' 100" }}
                  >
                    {lang === "es" ? "manifiesto" : "manifesto"}
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
                    {site.about}
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* CONTACT */}
      <section
        id="contact"
        className="relative border-t border-current/15 bg-[var(--tierra-ink)] text-[var(--tierra-bg)] px-6 py-24 md:px-10 md:py-32"
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-12 gap-8">
            <Reveal className="col-span-12 lg:col-span-6">
              <SectionLabel
                n="06"
                label="CONTACTO"
                total="06"
                className="border-current/40 text-[var(--tierra-bg)]"
              />
              <h2
                className="tierra-display mt-8 text-[clamp(40px,8vw,120px)] font-light leading-[0.92] tracking-[-0.03em]"
                style={{ fontVariationSettings: "'opsz' 120" }}
              >
                {lang === "es" ? "Hablemos" : "Let's talk"}
                <span
                  className="italic text-[var(--tierra-amber)]"
                  style={{ fontVariationSettings: "'opsz' 120, 'SOFT' 100" }}
                >
                  .
                </span>
              </h2>
              <p className="mt-6 max-w-[40ch] text-base leading-relaxed opacity-75 md:text-lg">
                {lang === "es"
                  ? "Cuéntame qué buscas y te respondo en el día. WhatsApp es el canal más rápido."
                  : "Tell me what you're looking for and I'll respond within the day. WhatsApp is fastest."}
              </p>
            </Reveal>
            <Reveal delay={0.2} className="col-span-12 lg:col-span-6">
              <ul className="space-y-2 border border-current/20 divide-y divide-current/15">
                {site.whatsapp && (
                  <li>
                    <a
                      href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                      className="group flex items-center justify-between p-6 transition-colors hover:bg-[var(--tierra-bg)] hover:text-[var(--tierra-ink)]"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div>
                        <Coord className="opacity-60">{t.portal.contact.whatsapp.toUpperCase()}</Coord>
                        <p
                          className="tierra-display mt-1 text-2xl font-medium"
                          style={{ fontVariationSettings: "'opsz' 24" }}
                        >
                          {site.whatsapp}
                        </p>
                      </div>
                      <ArrowUpRight
                        className="h-5 w-5 opacity-60 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                        strokeWidth={1.5}
                      />
                    </a>
                  </li>
                )}
                {site.email && (
                  <li>
                    <a
                      href={`mailto:${site.email}`}
                      className="group flex items-center justify-between p-6 transition-colors hover:bg-[var(--tierra-bg)] hover:text-[var(--tierra-ink)]"
                    >
                      <div>
                        <Coord className="opacity-60">{t.portal.contact.email.toUpperCase()}</Coord>
                        <p
                          className="tierra-display mt-1 text-2xl font-medium"
                          style={{ fontVariationSettings: "'opsz' 24" }}
                        >
                          {site.email}
                        </p>
                      </div>
                      <ArrowUpRight
                        className="h-5 w-5 opacity-60 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                        strokeWidth={1.5}
                      />
                    </a>
                  </li>
                )}
                {site.phone && (
                  <li>
                    <a
                      href={`tel:${site.phone.replace(/\D/g, "")}`}
                      className="group flex items-center justify-between p-6 transition-colors hover:bg-[var(--tierra-bg)] hover:text-[var(--tierra-ink)]"
                    >
                      <div>
                        <Coord className="opacity-60">{t.portal.contact.phone.toUpperCase()}</Coord>
                        <p
                          className="tierra-display mt-1 text-2xl font-medium"
                          style={{ fontVariationSettings: "'opsz' 24" }}
                        >
                          {site.phone}
                        </p>
                      </div>
                      <ArrowUpRight
                        className="h-5 w-5 opacity-60 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                        strokeWidth={1.5}
                      />
                    </a>
                  </li>
                )}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-[var(--tierra-surface)]/40">
        <WaveDivider />
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-6 md:px-10">
          <Coord className="opacity-60">
            © {new Date().getFullYear()} · {agent.name.toUpperCase()}
          </Coord>
          <Coord className="opacity-60">{t.footer.version}</Coord>
          <div className="flex items-center gap-2">
            <TierraLangToggle />
            <TierraThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// PROPERTY ROW (archive entry style)
// ============================================================

function PortalPropertyRow({
  property,
  index,
  slug,
  lang,
}: {
  property: PortalData["properties"][0];
  index: number;
  slug: string;
  lang: "es" | "en";
}) {
  const num = String(index + 1).padStart(3, "0");
  const price = property.priceUSD
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(property.priceUSD)
    : null;

  const operationLabel: Record<string, string> = lang === "es"
    ? { VENTA: "Venta", ALQUILER: "Alquiler" }
    : { VENTA: "Sale", ALQUILER: "Rental" };
  const categoryLabel: Record<string, string> = lang === "es"
    ? {
        CASA: "Casa",
        APARTAMENTO: "Apto.",
        VILLA: "Villa",
        LOCAL: "Local",
        OFICINA: "Oficina",
        SOLAR: "Solar",
        PENTHOUSE: "Penthouse",
      }
    : {
        CASA: "House",
        APARTAMENTO: "Apt.",
        VILLA: "Villa",
        LOCAL: "Retail",
        OFICINA: "Office",
        SOLAR: "Lot",
        PENTHOUSE: "Penthouse",
      };

  return (
    <Reveal delay={Math.min(index, 8) * 0.04}>
      <Link
        href={`/p/${slug}/${property.id}`}
        className="group relative grid grid-cols-12 items-center gap-4 border-b border-current/10 py-7 transition-colors hover:bg-[var(--tierra-surface)]/30"
      >
        {/* Number */}
        <span
          className="tierra-display col-span-2 text-3xl font-light italic text-[var(--tierra-primary)] md:col-span-1 md:text-2xl"
          style={{ fontVariationSettings: "'opsz' 30, 'SOFT' 100" }}
        >
          {num}
        </span>

        {/* Title + location */}
        <div className="col-span-10 md:col-span-4">
          <p
            className="tierra-display text-2xl font-medium leading-tight tracking-tight md:text-xl"
            style={{ fontVariationSettings: "'opsz' 24" }}
          >
            {property.title}
          </p>
          <Coord className="mt-1 opacity-70">
            {property.location ?? "—"}
          </Coord>
        </div>

        {/* Type */}
        <Coord className="col-span-6 opacity-80 md:col-span-2">
          {categoryLabel[property.category] ?? property.category} ·{" "}
          {operationLabel[property.operation] ?? property.operation}
        </Coord>

        {/* Area */}
        <Coord className="col-span-6 opacity-80 md:col-span-2">
          {property.metersSquared ? `${property.metersSquared} m²` : "—"}
          {property.bedrooms ? ` · ${property.bedrooms} hab` : ""}
        </Coord>

        {/* Price */}
        <div className="col-span-10 md:col-span-2 md:text-right">
          {price ? (
            <p
              className="tierra-display text-2xl font-medium tabular-nums md:text-xl"
              style={{ fontVariationSettings: "'opsz' 24" }}
            >
              {price}
            </p>
          ) : (
            <Coord className="opacity-50">{lang === "es" ? "Consultar" : "Inquire"}</Coord>
          )}
        </div>

        <ArrowUpRight
          className="col-span-2 hidden h-5 w-5 opacity-30 transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-80 md:col-span-1 md:block md:justify-self-end"
          strokeWidth={1.5}
        />
      </Link>
    </Reveal>
  );
}
