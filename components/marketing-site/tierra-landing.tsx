"use client";

/**
 * TIERRA CARIBE — Marketing landing
 * Editorial cartographic CRM landing for /welcome
 *
 * Sections:
 *  01 · Hero · An atlas for agents
 *  02 · Manifesto · The lone agent becomes a team
 *  03 · Atlas (features as map regions, 6 items)
 *  04 · Archive (catalog of properties)
 *  05 · Studio IA · before/after
 *  06 · Investment · pricing
 *  · Final CTA + Footer
 */

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useLang } from "./language-context";
import { useTierra } from "@/lib/tierra-i18n";
import {
  Caret,
  ChapterNumber,
  ContourBg,
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
import { TierraThemeToggle, TierraLangToggle } from "@/components/tierra/toggles";

export function TierraLanding() {
  const { lang } = useLang();
  const t = useTierra(lang);

  return (
    <div className="tierra tierra-grain relative min-h-screen overflow-hidden">
      {/* Atmospheric backdrop */}
      <ContourBg />

      <TopBar />
      <TickerBar t={t} />

      <main className="relative">
        <Hero t={t} lang={lang} />
        <Marquee t={t} />
        <Manifesto t={t} />
        <Atlas t={t} />
        <Archive t={t} />
        <Studio t={t} />
        <Pricing t={t} lang={lang} />
        <FinalCta t={t} />
      </main>

      <Footer t={t} />
    </div>
  );
}

// ============================================================
// TOP BAR — sticky compass + nav + toggles
// ============================================================

function TopBar() {
  const { lang } = useLang();
  const t = useTierra(lang);

  return (
    <header className="sticky top-0 z-40 border-b border-current/15 bg-[var(--tierra-bg)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-3 md:px-10">
        {/* Brand */}
        <Link href="/welcome" className="group flex items-center gap-3">
          <NorthArrow size={32} />
          <div className="flex flex-col leading-none">
            <span className="tierra-mono text-[10px] font-semibold uppercase tracking-[0.22em]">
              {t.brand.name}
            </span>
            <span
              className="tierra-display mt-0.5 text-[11px] italic opacity-70"
              style={{ fontVariationSettings: "'opsz' 12" }}
            >
              {t.brand.sub}
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {[
            { k: "03", l: t.atlas.title.split(" ")[0] + " " + t.atlas.title.split(" ")[1] },
            { k: "04", l: t.archive.title },
            { k: "05", l: t.studio.title.split(" ")[0] || "Studio" },
            { k: "06", l: t.pricing.title },
          ].map((n) => (
            <a
              key={n.k}
              href={`#section-${n.k}`}
              className="tierra-mono group flex items-baseline gap-2 text-[10px] font-medium uppercase tracking-[0.18em]"
            >
              <span className="opacity-40">{n.k}</span>
              <span className="tierra-link">{n.l}</span>
            </a>
          ))}
        </nav>

        {/* Toggles + CTA */}
        <div className="flex items-center gap-2">
          <TierraLangToggle />
          <TierraThemeToggle className="hidden sm:inline-flex" />
          <Link href="/login" className="tierra-mono hidden text-[10px] font-medium uppercase tracking-[0.18em] sm:block">
            <span className="tierra-link">{lang === "es" ? "Entrar" : "Sign in"}</span>
          </Link>
          <Link href="/signup" className="tierra-btn">
            {t.hero.ctaPrimary}
          </Link>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// TICKER BAR — running coordinates / metadata
// ============================================================

function TickerBar({ t }: { t: ReturnType<typeof useTierra> }) {
  return (
    <div className="border-b border-current/10 bg-[var(--tierra-surface)]/40">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-8 overflow-x-auto px-6 py-2 md:px-10">
        <div className="flex items-center gap-6 whitespace-nowrap">
          <Coord>
            <span className="opacity-50">{t.status.coordinatesLabel}</span>
            18.4861° N · 69.9312° W
          </Coord>
          <Coord className="hidden md:inline-flex">
            <span className="opacity-50">{t.status.meridian}</span>
            UTC −04:00
          </Coord>
          <Coord className="hidden lg:inline-flex">
            <span className="opacity-50">{t.status.tide}</span>
            {t.status.tideValue}
          </Coord>
        </div>
        <Coord>
          <span className="opacity-50">{t.status.issue}</span>
          {t.status.issueValue}
        </Coord>
      </div>
    </div>
  );
}

// ============================================================
// HERO — editorial atlas opening
// ============================================================

function Hero({ t, lang }: { t: ReturnType<typeof useTierra>; lang: "es" | "en" }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section
      ref={ref}
      id="section-01"
      className="relative overflow-hidden px-6 pb-24 pt-12 md:px-10 md:pt-16 lg:pt-20"
    >
      {/* Decorative sun (light) / moon glow */}
      <motion.div
        style={reduced ? undefined : { y }}
        className="pointer-events-none absolute -right-20 top-12 opacity-40 md:right-12 md:top-20"
      >
        <Sun size={180} className="text-[var(--tierra-amber)]" />
      </motion.div>

      {/* Coordinates corner ticks */}
      <div className="absolute left-6 top-6 hidden md:flex">
        <Coord className="opacity-50">N 18.4831°</Coord>
      </div>
      <div className="absolute right-6 top-6 hidden md:flex">
        <Coord className="opacity-50">W 69.9312°</Coord>
      </div>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
        {/* Left — text */}
        <div className="lg:col-span-8">
          <Reveal delay={0.05}>
            <div className="flex items-baseline gap-3">
              <Coord>{t.hero.kicker}</Coord>
              <span className="h-px flex-1 bg-current/30" />
            </div>
          </Reveal>

          <Reveal delay={0.15} className="mt-8" as="h1">
            <span
              className="tierra-display block leading-[0.92] tracking-[-0.03em]"
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              <span className="block text-[clamp(48px,10vw,160px)] font-light">
                {t.hero.h1Pre}
              </span>
              <span
                className="block text-[clamp(54px,11vw,180px)] font-light italic text-[var(--tierra-primary)]"
                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100" }}
              >
                {t.hero.h1Mid}
              </span>
              <span className="block text-[clamp(48px,10vw,160px)] font-light">
                {t.hero.h1Post}
                <Caret />
              </span>
            </span>
          </Reveal>

          <Reveal delay={0.4} className="mt-10 max-w-[640px]">
            <p className="font-[var(--font-instrument)] text-lg leading-relaxed opacity-80 md:text-xl">
              {t.hero.lead}
            </p>
          </Reveal>

          <Reveal delay={0.55} className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="tierra-btn">
              {t.hero.ctaPrimary} <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
            <a href="#section-04" className="tierra-btn tierra-btn--ghost">
              {t.hero.ctaSecondary}
            </a>
          </Reveal>

          <Reveal delay={0.7} className="mt-14">
            <div className="flex flex-wrap items-center gap-6 border-t border-current/15 pt-5">
              {[t.hero.meta1, t.hero.meta2, t.hero.meta3].map((m, i) => (
                <Coord key={i} className="opacity-70">
                  <span className="opacity-50">0{i + 1}</span>
                  {m}
                </Coord>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Right — editorial side card */}
        <Reveal delay={0.3} className="relative lg:col-span-4">
          <div className="relative h-full">
            <EdgeTicks />
            <div className="space-y-6 border border-current/20 bg-[var(--tierra-surface)]/40 p-8">
              {/* Island mini-map */}
              <div className="flex items-start justify-between">
                <Coord className="opacity-60">FIG. 01</Coord>
                <Coord className="opacity-60">REPÚBLICA DOMINICANA</Coord>
              </div>
              <MiniMap
                size={260}
                seed={7}
                className="mx-auto block text-[var(--tierra-primary)]"
              />
              <div className="space-y-2 border-t border-current/15 pt-4">
                <p
                  className="tierra-display text-2xl italic leading-tight"
                  style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 100" }}
                >
                  Caribe basin, <span className="text-[var(--tierra-primary)]">2026</span>
                </p>
                <p className="text-xs leading-relaxed opacity-70">
                  {lang === "es"
                    ? "Plataforma operada desde Santiago de los Caballeros, República Dominicana. Catalogando el territorio en cinco regiones."
                    : "Platform operated from Santiago de los Caballeros, Dominican Republic. Cataloging the territory across five regions."}
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] opacity-60">
                <Coord>SCALE 1:850k</Coord>
                <Coord>EDITION I</Coord>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* bottom wave divider */}
      <div className="mt-20 border-t border-current/15">
        <WaveDivider className="opacity-50" />
      </div>
    </section>
  );
}

// ============================================================
// MARQUEE — running list of features
// ============================================================

function Marquee({ t }: { t: ReturnType<typeof useTierra> }) {
  const items = [...t.marquee, ...t.marquee];
  return (
    <section className="border-y border-current/15 bg-[var(--tierra-surface)]/30">
      <div className="overflow-hidden py-4">
        <div className="animate-marquee flex w-max items-center gap-12 whitespace-nowrap">
          {items.map((m, i) => (
            <span
              key={i}
              className="tierra-display flex items-center gap-12 text-2xl italic md:text-4xl"
              style={{ fontVariationSettings: "'opsz' 36" }}
            >
              <span className="text-[var(--tierra-terracotta)]">✺</span>
              {m}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// MANIFESTO — 4 pillars
// ============================================================

function Manifesto({ t }: { t: ReturnType<typeof useTierra> }) {
  return (
    <section id="section-02" className="relative px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-12 gap-8">
          {/* Big chapter number — left rail */}
          <Reveal className="col-span-12 lg:col-span-3">
            <SectionLabel n={t.manifesto.n} label="MANIFIESTO" total="06" />
            <ChapterNumber n="02" className="mt-6" />
          </Reveal>

          {/* Title + body */}
          <Reveal delay={0.15} className="col-span-12 lg:col-span-9">
            <h2
              className="tierra-display max-w-[14ch] text-[clamp(40px,7vw,96px)] font-light leading-[1] tracking-[-0.025em]"
              style={{ fontVariationSettings: "'opsz' 96" }}
            >
              {t.manifesto.title}
              <br />
              <span
                className="italic text-[var(--tierra-primary)]"
                style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 100" }}
              >
                {t.manifesto.titleAlt}
              </span>
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-8 border-t border-current/15 pt-8 md:grid-cols-2">
              {t.manifesto.body.map((p, i) => (
                <p key={i} className="text-base leading-relaxed opacity-85 md:text-lg">
                  <span
                    className="tierra-display mr-2 align-baseline text-3xl italic text-[var(--tierra-primary)]"
                    style={{ fontVariationSettings: "'opsz' 36, 'SOFT' 100" }}
                  >
                    {String.fromCharCode(8220)}
                  </span>
                  {p}
                </p>
              ))}
            </div>

            {/* 4 pillars */}
            <div className="mt-16 grid grid-cols-2 gap-px border border-current/15 bg-current/15 md:grid-cols-4">
              {t.manifesto.pillars.map((pillar) => (
                <div
                  key={pillar.n}
                  className="group relative bg-[var(--tierra-bg)] p-6 transition-colors hover:bg-[var(--tierra-surface)]"
                >
                  <Coord className="opacity-50">{pillar.n}</Coord>
                  <p
                    className="tierra-display mt-3 text-3xl font-medium leading-tight"
                    style={{ fontVariationSettings: "'opsz' 36" }}
                  >
                    {pillar.word}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed opacity-70">{pillar.desc}</p>
                  <ArrowUpRight
                    className="absolute right-4 top-4 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60"
                    strokeWidth={1.5}
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// ATLAS — 6 regions
// ============================================================

function Atlas({ t }: { t: ReturnType<typeof useTierra> }) {
  return (
    <section
      id="section-03"
      className="relative border-t border-current/15 bg-[var(--tierra-surface)]/20 px-6 py-24 md:px-10 md:py-32"
    >
      <ContourBg />
      <div className="relative mx-auto max-w-[1500px]">
        <div className="grid grid-cols-12 gap-8">
          <Reveal className="col-span-12 lg:col-span-4">
            <SectionLabel n={t.atlas.n} label="ATLAS" total="06" />
            <h2
              className="tierra-display mt-6 text-[clamp(40px,6vw,84px)] font-light leading-[0.96] tracking-[-0.025em]"
              style={{ fontVariationSettings: "'opsz' 84" }}
            >
              {t.atlas.title}
              <br />
              <span
                className="italic text-[var(--tierra-primary)]"
                style={{ fontVariationSettings: "'opsz' 84, 'SOFT' 100" }}
              >
                {t.atlas.titleAlt}
              </span>
            </h2>
            <p className="mt-6 max-w-[36ch] text-base leading-relaxed opacity-75">
              {t.atlas.sub}
            </p>
            <div className="mt-10">
              <PalmFrond size={200} className="text-[var(--tierra-primary)] opacity-60" />
            </div>
          </Reveal>

          <div className="col-span-12 grid grid-cols-1 gap-px border border-current/15 bg-current/15 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
            {t.atlas.regions.map((r, i) => (
              <Reveal key={r.n} delay={i * 0.06}>
                <div className="group relative h-full bg-[var(--tierra-bg)] p-6 transition-all hover:bg-[var(--tierra-surface)]">
                  <div className="flex items-start justify-between">
                    <span
                      className="tierra-display text-5xl font-light italic text-[var(--tierra-primary)]"
                      style={{ fontVariationSettings: "'opsz' 72, 'SOFT' 100" }}
                    >
                      {r.n}
                    </span>
                    <Coord className="opacity-60">{r.coord}</Coord>
                  </div>
                  <p
                    className="tierra-display mt-6 text-2xl font-medium leading-tight"
                    style={{ fontVariationSettings: "'opsz' 24" }}
                  >
                    {r.title}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed opacity-70">{r.desc}</p>
                  <MiniMap
                    size={50}
                    seed={i + 1}
                    className="absolute bottom-4 right-4 text-[var(--tierra-primary)] opacity-30 transition-opacity group-hover:opacity-70"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// ARCHIVE — catalog of property entries
// ============================================================

function Archive({ t }: { t: ReturnType<typeof useTierra> }) {
  const STATUS_COLOR: Record<string, string> = {
    Activo: "text-[var(--tierra-primary)]",
    Active: "text-[var(--tierra-primary)]",
    Reservado: "text-[var(--tierra-terracotta)]",
    Reserved: "text-[var(--tierra-terracotta)]",
    "Pre-venta": "text-[var(--tierra-sea)]",
    "Pre-sale": "text-[var(--tierra-sea)]",
  };

  return (
    <section
      id="section-04"
      className="relative border-t border-current/15 px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-12 gap-8">
          <Reveal className="col-span-12 lg:col-span-3">
            <SectionLabel n={t.archive.n} label="ARCHIVO" total="06" />
            <ChapterNumber n="04" className="mt-6" />
          </Reveal>

          <Reveal delay={0.15} className="col-span-12 lg:col-span-9">
            <h2
              className="tierra-display max-w-[14ch] text-[clamp(40px,7vw,96px)] font-light leading-[1] tracking-[-0.025em]"
              style={{ fontVariationSettings: "'opsz' 96" }}
            >
              {t.archive.title}
              <br />
              <span
                className="italic text-[var(--tierra-primary)]"
                style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 100" }}
              >
                {t.archive.titleAlt}
              </span>
            </h2>
            <p className="mt-8 max-w-[60ch] text-base leading-relaxed opacity-75">
              {t.archive.sub}
            </p>

            {/* Catalog table */}
            <div className="mt-14 border-t border-current/30">
              {/* Head */}
              <div className="hidden grid-cols-[60px_1.4fr_1fr_0.6fr_0.6fr_0.8fr_24px] items-center gap-4 border-b border-current/15 py-3 md:grid">
                {Object.values(t.archive.tableHead).map((h, i) => (
                  <Coord key={i} className="opacity-60">
                    {h as string}
                  </Coord>
                ))}
                <span />
              </div>
              {/* Rows */}
              {t.archive.entries.map((row, i) => (
                <Reveal key={row.n} delay={i * 0.04}>
                  <a
                    href="#"
                    className="group relative grid grid-cols-2 gap-2 border-b border-current/10 py-5 transition-colors hover:bg-[var(--tierra-surface)]/30 md:grid-cols-[60px_1.4fr_1fr_0.6fr_0.6fr_0.8fr_24px] md:items-center md:gap-4"
                  >
                    <div className="col-span-2 md:col-span-1">
                      <span
                        className="tierra-display text-3xl font-light italic text-[var(--tierra-primary)] md:text-2xl"
                        style={{ fontVariationSettings: "'opsz' 30, 'SOFT' 100" }}
                      >
                        {row.n}
                      </span>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p
                        className="tierra-display text-2xl font-medium leading-tight tracking-tight md:text-xl"
                        style={{ fontVariationSettings: "'opsz' 24" }}
                      >
                        {row.location}
                      </p>
                    </div>
                    <Coord className="opacity-80">{row.type}</Coord>
                    <Coord className="opacity-80">{row.area}</Coord>
                    <Coord className="opacity-80">{row.year}</Coord>
                    <Coord className={STATUS_COLOR[row.status] ?? ""}>
                      ● {row.status}
                    </Coord>
                    <ArrowUpRight
                      className="hidden h-4 w-4 opacity-30 transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-80 md:block"
                      strokeWidth={1.5}
                    />
                  </a>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// STUDIO — before/after + tools grid
// ============================================================

function Studio({ t }: { t: ReturnType<typeof useTierra> }) {
  return (
    <section
      id="section-05"
      className="relative overflow-hidden border-t border-current/15 bg-[var(--tierra-ink)] text-[var(--tierra-bg)] px-6 py-24 md:px-10 md:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, var(--tierra-primary) 0%, transparent 50%), radial-gradient(circle at 80% 70%, var(--tierra-terracotta) 0%, transparent 50%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1500px]">
        <div className="grid grid-cols-12 gap-8">
          <Reveal className="col-span-12 lg:col-span-4">
            <SectionLabel
              n={t.studio.n}
              label="ESTUDIO"
              total="06"
              className="border-current/40 text-[var(--tierra-bg)]"
            />
            <h2
              className="tierra-display mt-6 text-[clamp(40px,6vw,84px)] font-light leading-[0.96] tracking-[-0.025em]"
              style={{ fontVariationSettings: "'opsz' 84" }}
            >
              {t.studio.title}
              <br />
              <span
                className="italic text-[var(--tierra-amber)]"
                style={{ fontVariationSettings: "'opsz' 84, 'SOFT' 100" }}
              >
                {t.studio.titleAlt}
              </span>
            </h2>
            <p className="mt-6 max-w-[40ch] text-base leading-relaxed opacity-75">
              {t.studio.sub}
            </p>
            <Link href="/signup" className="tierra-btn mt-10" style={{ background: "var(--tierra-amber)", color: "var(--tierra-ink)", borderColor: "var(--tierra-amber)" }}>
              {t.studio.cta} <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </Reveal>

          <div className="col-span-12 grid grid-cols-2 gap-px lg:col-span-8 md:grid-cols-3">
            {t.studio.tools.map((tool, i) => (
              <Reveal key={tool.name} delay={i * 0.05}>
                <div className="group relative h-full border border-current/15 p-6 transition-colors hover:bg-[var(--tierra-bg)] hover:text-[var(--tierra-ink)]">
                  <EdgeTicks />
                  <Coord className="opacity-50">0{i + 1}</Coord>
                  <p
                    className="tierra-display mt-4 text-3xl font-medium leading-tight"
                    style={{ fontVariationSettings: "'opsz' 36" }}
                  >
                    {tool.name}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed opacity-70">{tool.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// PRICING
// ============================================================

function Pricing({ t, lang }: { t: ReturnType<typeof useTierra>; lang: "es" | "en" }) {
  const plans = [
    {
      n: "I",
      name: "FREE",
      tagline: lang === "es" ? "Para empezar" : "To begin",
      price: 0,
      features: lang === "es"
        ? ["CRM completo", "5 créditos IA / mes", "Hasta 10 propiedades", "1 plantilla"]
        : ["Full CRM", "5 AI credits / mo", "Up to 10 properties", "1 template"],
      cta: lang === "es" ? "Empezar gratis" : "Start free",
      featured: false,
    },
    {
      n: "II",
      name: "PRO",
      tagline: lang === "es" ? "Más popular" : "Most popular",
      price: 15,
      features: lang === "es"
        ? ["Todo en Free", "50 créditos IA", "Propiedades ilimitadas", "Las 4 plantillas", "Sin marca de agua"]
        : ["All Free features", "50 AI credits", "Unlimited properties", "All 4 templates", "No watermark"],
      cta: lang === "es" ? "Probar Pro" : "Try Pro",
      featured: true,
    },
    {
      n: "III",
      name: "TEAM",
      tagline: lang === "es" ? "Equipos" : "Teams",
      price: 39,
      features: lang === "es"
        ? ["Todo en Pro", "200 créditos IA", "5 usuarios", "Dominio propio", "Branding"]
        : ["All Pro features", "200 AI credits", "5 users", "Custom domain", "Branding"],
      cta: lang === "es" ? "Hablar con ventas" : "Talk to sales",
      featured: false,
    },
  ];

  return (
    <section
      id="section-06"
      className="relative border-t border-current/15 px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-12 gap-8">
          <Reveal className="col-span-12 lg:col-span-4">
            <SectionLabel n={t.pricing.n} label="INVERSIÓN" total="06" />
            <h2
              className="tierra-display mt-6 text-[clamp(40px,6vw,84px)] font-light leading-[0.96] tracking-[-0.025em]"
              style={{ fontVariationSettings: "'opsz' 84" }}
            >
              {t.pricing.title}
              <br />
              <span
                className="italic text-[var(--tierra-primary)]"
                style={{ fontVariationSettings: "'opsz' 84, 'SOFT' 100" }}
              >
                {t.pricing.titleAlt}
              </span>
            </h2>
            <p className="mt-6 max-w-[36ch] text-base leading-relaxed opacity-75">
              {t.pricing.sub}
            </p>
          </Reveal>

          <div className="col-span-12 grid grid-cols-1 gap-4 lg:col-span-8 md:grid-cols-3">
            {plans.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.08}>
                <div
                  className={`relative flex h-full flex-col border p-7 transition-all hover:-translate-y-1 ${
                    p.featured
                      ? "border-current/60 bg-[var(--tierra-ink)] text-[var(--tierra-bg)]"
                      : "border-current/20 bg-[var(--tierra-surface)]/30"
                  }`}
                >
                  <EdgeTicks />
                  <div className="flex items-start justify-between">
                    <div>
                      <Coord className="opacity-60">PLAN {p.n}</Coord>
                      <p
                        className="tierra-display mt-2 text-4xl font-medium"
                        style={{ fontVariationSettings: "'opsz' 36" }}
                      >
                        {p.name}
                      </p>
                      <p className="mt-1 text-xs italic opacity-70">{p.tagline}</p>
                    </div>
                    {p.featured && (
                      <Sun size={28} className="text-[var(--tierra-amber)]" />
                    )}
                  </div>
                  <div className="mt-8 flex items-baseline gap-1">
                    <span
                      className="tierra-display text-6xl font-light"
                      style={{ fontVariationSettings: "'opsz' 72" }}
                    >
                      ${p.price}
                    </span>
                    <Coord>USD / MO</Coord>
                  </div>
                  <ul className="mt-8 flex-1 space-y-2 border-t border-current/15 pt-6">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm leading-relaxed"
                      >
                        <span className="text-[var(--tierra-primary)] mt-0.5">✺</span>
                        <span className="opacity-90">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className="tierra-btn mt-8"
                    style={
                      p.featured
                        ? { background: "var(--tierra-amber)", color: "var(--tierra-ink)", borderColor: "var(--tierra-amber)" }
                        : undefined
                    }
                  >
                    {p.cta} <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FINAL CTA
// ============================================================

function FinalCta({ t }: { t: ReturnType<typeof useTierra> }) {
  return (
    <section className="relative overflow-hidden border-t border-current/15 px-6 py-32 md:px-10 md:py-40">
      <ContourBg />
      <div className="relative mx-auto max-w-[1500px] text-center">
        <Reveal>
          <SectionLabel n={t.finalCta.label} label="FIRMA" className="mx-auto inline-flex" />
        </Reveal>
        <Reveal delay={0.1} className="mt-10">
          <h2
            className="tierra-display mx-auto max-w-[18ch] text-[clamp(48px,9vw,140px)] font-light leading-[0.96] tracking-[-0.03em]"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            {t.finalCta.title}{" "}
            <span
              className="italic text-[var(--tierra-primary)]"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100" }}
            >
              {t.finalCta.titleAlt}
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.25} className="mx-auto mt-8 max-w-[48ch]">
          <p className="text-base leading-relaxed opacity-75 md:text-lg">{t.finalCta.sub}</p>
        </Reveal>
        <Reveal delay={0.4} className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="tierra-btn">
            {t.finalCta.primary} <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
          </Link>
          <a href="#" className="tierra-btn tierra-btn--ghost">
            {t.finalCta.secondary}
          </a>
        </Reveal>
        <Reveal delay={0.55} className="mt-16 flex items-center justify-center">
          <NorthArrow size={64} className="text-[var(--tierra-primary)] opacity-70" />
        </Reveal>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER
// ============================================================

function Footer({ t }: { t: ReturnType<typeof useTierra> }) {
  return (
    <footer className="relative border-t border-current/15 bg-[var(--tierra-surface)]/40">
      <WaveDivider className="border-b border-current/10" />
      <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-8 px-6 py-16 md:grid-cols-5 md:px-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-2">
          <NorthArrow size={48} />
          <p
            className="tierra-display mt-6 text-4xl font-light leading-tight tracking-tight"
            style={{ fontVariationSettings: "'opsz' 36, 'SOFT' 100" }}
          >
            estaila
            <br />
            <span className="italic text-[var(--tierra-primary)]">× tierra</span>
          </p>
          <p className="mt-4 max-w-[28ch] text-sm leading-relaxed opacity-70">
            {t.brand.tagline}
          </p>
          <div className="mt-8 space-y-1">
            <Coord>{t.footer.lat}</Coord>
            <br />
            <Coord>{t.footer.lng}</Coord>
            <br />
            <Coord className="opacity-60">{t.footer.island}</Coord>
          </div>
        </div>

        {/* Product links */}
        <div>
          <Coord className="opacity-60">{t.footer.product}</Coord>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="#section-03" className="tierra-link opacity-80">{t.atlas.title}</a></li>
            <li><a href="#section-05" className="tierra-link opacity-80">{t.studio.title}</a></li>
            <li><a href="#section-06" className="tierra-link opacity-80">{t.pricing.title}</a></li>
          </ul>
        </div>
        <div>
          <Coord className="opacity-60">{t.footer.company}</Coord>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="#" className="tierra-link opacity-80">{t.footer.about}</a></li>
            <li><a href="#" className="tierra-link opacity-80">{t.footer.blog}</a></li>
            <li><a href="#" className="tierra-link opacity-80">{t.footer.careers}</a></li>
          </ul>
        </div>
        <div>
          <Coord className="opacity-60">{t.footer.legal}</Coord>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="#" className="tierra-link opacity-80">{t.footer.terms}</a></li>
            <li><a href="#" className="tierra-link opacity-80">{t.footer.privacy}</a></li>
            <li><a href="#" className="tierra-link opacity-80">{t.footer.contact}</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-current/10">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-10">
          <Coord className="opacity-60">{t.footer.version}</Coord>
          <Coord className="opacity-60">© 2026 · ALL RIGHTS RESERVED</Coord>
          <div className="flex items-center gap-2">
            <TierraLangToggle />
            <TierraThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
