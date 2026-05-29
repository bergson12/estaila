"use client";

/**
 * Agent portal /p/[slug] — handoff "Agente independiente" design.
 * Theme-aware (light/dark) + per-agent branding via site.primaryColor.
 * Display type: Space Grotesk (global --font-display). Accent: brand green.
 */

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { LanguageProvider, useLang } from "@/components/marketing-site/language-context";
import { LangToggle } from "@/components/marketing-site/lang-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import type { PortalData } from "../types";

export function AgentPortalCrm(props: PortalData) {
  return (
    <LanguageProvider>
      <PortalContent {...props} />
    </LanguageProvider>
  );
}

const COPY = {
  es: {
    nav: { catalog: "Propiedades", about: "Sobre mí", contact: "Contacto" },
    hero: {
      kicker: "Asesor inmobiliario",
      greet: "Hola, soy",
      sub: "Te acompaño a comprar, vender o alquilar con confianza. Mi cartera activa y la forma más rápida de hablarme.",
      cta: "Ver propiedades",
      ctaAlt: "Hablemos",
    },
    catalog: {
      eyebrow: "CARTERA",
      title: "Propiedades destacadas",
      sub: "Selección actual. Para opciones fuera de cartera, escríbeme.",
      empty: "Catálogo en preparación",
      seeAll: "Ver todas",
    },
    why: {
      eyebrow: "POR QUÉ YO",
      title: "Acompañamiento real, de principio a fin.",
      reasons: [
        ["Respuesta rápida", "Te contesto el mismo día, siempre."],
        ["Asesoría honesta", "Te digo lo que necesitas saber para decidir bien."],
        ["Marketing con IA", "Tus propiedades mejor presentadas, llegan a más gente."],
      ] as [string, string][],
    },
    contact: {
      eyebrow: "CONTACTO",
      title: "¿Listo para dar el siguiente paso?",
      sub: "Cuéntame qué buscas y te ayudo a encontrarlo. Sin compromiso.",
      whatsapp: "Escríbeme por WhatsApp",
      meeting: "Agendar reunión",
      email: "Enviar email",
    },
    stats: { active: "Activas", total: "Total" },
    rentSuffix: " / mes",
    inquire: "Consultar",
    verified: "Asesor verificado",
  },
  en: {
    nav: { catalog: "Properties", about: "About", contact: "Contact" },
    hero: {
      kicker: "Real estate advisor",
      greet: "Hi, I'm",
      sub: "I help you buy, sell or rent with confidence. My active portfolio and the fastest way to reach me.",
      cta: "Browse properties",
      ctaAlt: "Let's talk",
    },
    catalog: {
      eyebrow: "PORTFOLIO",
      title: "Featured properties",
      sub: "Current selection. For off-list options, message me.",
      empty: "Catalog in preparation",
      seeAll: "See all",
    },
    why: {
      eyebrow: "WHY ME",
      title: "Real support, from start to finish.",
      reasons: [
        ["Fast replies", "I get back to you the same day, always."],
        ["Honest advice", "I tell you what you need to know to decide well."],
        ["AI marketing", "Your listings, better presented, reaching more people."],
      ] as [string, string][],
    },
    contact: {
      eyebrow: "CONTACT",
      title: "Ready for the next step?",
      sub: "Tell me what you're looking for and I'll help you find it. No pressure.",
      whatsapp: "Message me on WhatsApp",
      meeting: "Book a meeting",
      email: "Send email",
    },
    stats: { active: "Active", total: "Total" },
    rentSuffix: " / mo",
    inquire: "Inquire",
    verified: "Verified advisor",
  },
};

type Copy = typeof COPY.es;

const REASON_ICONS = [Clock, ShieldCheck, Sparkles];

function PortalContent({ site, agent, properties }: PortalData) {
  const { lang } = useLang();
  const t = COPY[lang];
  const accent = site.primaryColor || undefined;
  const firstName = (agent.name ?? "").split(/\s+/)[0] || agent.name;
  const initials =
    (agent.name ?? "—")
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "—";

  const active = properties.filter(
    (p) => p.status !== "VENDIDA" && p.status !== "ALQUILADA"
  );
  const waHref = site.whatsapp
    ? `https://wa.me/${site.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground">
      {/* ===================== NAV ===================== */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-3.5 md:px-8">
          <Link href={`/p/${site.slug}`} className="flex items-center gap-2.5">
            {agent.image ? (
              <Image
                src={agent.image}
                alt={agent.name}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full border border-border object-cover"
              />
            ) : site.logoUrl ? (
              <Image
                src={site.logoUrl}
                alt={agent.name}
                width={36}
                height={36}
                className="h-9 w-9 rounded-md object-cover"
              />
            ) : (
              <span
                className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white"
                style={{ background: accent ?? "var(--primary)" }}
              >
                {initials}
              </span>
            )}
            <span className="font-display text-base font-bold tracking-tight">
              {site.title ?? agent.name}
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#catalog" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t.nav.catalog}
            </a>
            {site.about && (
              <a href="#about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {t.nav.about}
              </a>
            )}
            <a href="#contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t.nav.contact}
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            {waHref && (
              <Button asChild size="sm" style={accent ? { background: accent } : undefined}>
                <a href={waHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-1 h-3.5 w-3.5" strokeWidth={2} />
                  {t.hero.ctaAlt}
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ===================== HERO ===================== */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div
            className="pointer-events-none absolute -right-24 -top-32 h-[520px] w-[520px] rounded-full opacity-60 blur-2xl"
            style={{
              background: `radial-gradient(circle, color-mix(in srgb, ${accent ?? "var(--primary)"} 18%, transparent), transparent 70%)`,
            }}
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-[clamp(32px,5vw,64px)] px-5 py-[clamp(44px,6vw,84px)] md:px-8 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-display text-[13px] font-semibold"
                style={{
                  color: accent ?? "var(--primary)",
                  borderColor: `color-mix(in srgb, ${accent ?? "var(--primary)"} 25%, transparent)`,
                  background: `color-mix(in srgb, ${accent ?? "var(--primary)"} 8%, transparent)`,
                }}
              >
                <Star className="h-3.5 w-3.5" strokeWidth={2} />
                {t.hero.kicker}
              </span>
              <h1 className="mt-5 text-[clamp(36px,5vw,62px)] font-bold leading-[1.02] tracking-[-0.035em]">
                {t.hero.greet}{" "}
                <span style={{ color: accent ?? "var(--primary)" }}>{firstName}</span>
                <span className="text-muted-foreground">.</span>
              </h1>
              <p className="mt-5 max-w-[48ch] text-[clamp(16px,1.4vw,19px)] leading-[1.6] text-muted-foreground">
                {site.tagline ?? t.hero.sub}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {waHref && (
                  <Button asChild size="lg" className="h-12 px-6" style={accent ? { background: accent } : undefined}>
                    <a href={waHref} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-1.5 h-[18px] w-[18px]" strokeWidth={2} />
                      {t.hero.ctaAlt}
                    </a>
                  </Button>
                )}
                <Button asChild size="lg" variant="outline" className="h-12 px-6">
                  <a href="#catalog">
                    {t.hero.cta}
                    <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2} />
                  </a>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-9 gap-y-4">
                <HeroStat n={active.length} l={t.stats.active} accent={accent} />
                <HeroStat n={properties.length} l={t.stats.total} accent={accent} />
                {site.email && (
                  <div className="flex flex-col">
                    <span className="inline-flex items-center gap-1.5 font-display text-base font-bold tracking-tight">
                      <Mail className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <span className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      {site.email}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Agent photo */}
            <div className="relative mx-auto w-full max-w-[400px]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-muted to-muted/50 shadow-xl">
                {agent.image ? (
                  <Image
                    src={agent.image}
                    alt={agent.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <span
                      className="font-display text-6xl font-bold"
                      style={{ color: accent ?? "var(--primary)" }}
                    >
                      {initials}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border border-border bg-background p-3.5 shadow-xl">
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl text-white"
                  style={{ background: accent ?? "var(--primary)" }}
                >
                  <ShieldCheck className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <div className="font-display text-sm font-bold leading-tight">
                    {t.verified}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    estaila · {site.slug}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== CATALOG ===================== */}
        <section id="catalog" className="relative scroll-mt-16 border-b border-border/60 px-5 py-[clamp(48px,6vw,88px)] md:px-8">
          <div className="mx-auto max-w-[1120px]">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow accent={accent}>{t.catalog.eyebrow}</Eyebrow>
                <h2 className="mt-2.5 font-display text-[clamp(28px,3.4vw,42px)] font-bold tracking-[-0.03em]">
                  {t.catalog.title}
                </h2>
              </div>
            </div>

            {active.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
                <p className="text-base text-muted-foreground">{t.catalog.empty}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((p, i) => (
                  <PropertyCard
                    key={p.id}
                    p={p}
                    delay={Math.min(i, 8) * 0.05}
                    slug={site.slug}
                    lang={lang}
                    t={t}
                    accent={accent}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ===================== WHY ME + ABOUT ===================== */}
        <section
          id="about"
          className="relative scroll-mt-16 border-b border-border/60 bg-card/20 px-5 py-[clamp(48px,6vw,88px)] md:px-8"
        >
          <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-[clamp(32px,5vw,64px)] lg:grid-cols-2">
            <div>
              <Eyebrow accent={accent}>{t.why.eyebrow}</Eyebrow>
              <h2 className="mt-3 font-display text-[clamp(26px,3.2vw,40px)] font-bold leading-[1.1] tracking-[-0.03em]">
                {t.why.title}
              </h2>
              <div className="mt-8 flex flex-col gap-5">
                {t.why.reasons.map(([title, desc], i) => {
                  const Icon = REASON_ICONS[i] ?? Sparkles;
                  return (
                    <div key={title} className="flex gap-4">
                      <span
                        className="grid h-12 w-12 flex-none place-items-center rounded-xl border border-border bg-background"
                        style={{ color: accent ?? "var(--primary)" }}
                      >
                        <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
                      </span>
                      <div>
                        <div className="font-display text-[17px] font-semibold tracking-tight">
                          {title}
                        </div>
                        <p className="mt-1 text-[14.5px] leading-[1.5] text-muted-foreground">
                          {desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* About / quote card */}
            <div className="rounded-3xl border border-border bg-background p-[clamp(28px,3vw,40px)] shadow-md">
              <div className="flex gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-500" strokeWidth={0} />
                ))}
              </div>
              <p className="mt-5 text-[clamp(18px,1.6vw,22px)] font-medium leading-[1.5] tracking-[-0.01em] text-foreground/90">
                {site.about ??
                  (lang === "es"
                    ? "Mi compromiso es simple: acompañarte con transparencia en cada paso, para que tu próxima decisión inmobiliaria sea la correcta."
                    : "My commitment is simple: to guide you transparently every step of the way, so your next real estate decision is the right one.")}
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                {agent.image ? (
                  <Image
                    src={agent.image}
                    alt={agent.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full border border-border object-cover"
                  />
                ) : (
                  <span
                    className="grid h-11 w-11 place-items-center rounded-full font-display text-sm font-bold text-white"
                    style={{ background: accent ?? "var(--primary)" }}
                  >
                    {initials}
                  </span>
                )}
                <div>
                  <div className="font-display text-[15px] font-semibold tracking-tight">
                    {agent.name}
                  </div>
                  <div className="text-[13px] text-muted-foreground">{t.hero.kicker}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== CONTACT CTA ===================== */}
        <section id="contact" className="scroll-mt-16 px-5 py-[clamp(48px,6vw,88px)] md:px-8">
          <div className="relative mx-auto max-w-[1120px] overflow-hidden rounded-[26px] bg-foreground px-[clamp(28px,5vw,64px)] py-[clamp(40px,5vw,72px)] text-center text-background">
            <div
              className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full opacity-50 blur-2xl"
              style={{
                background: `radial-gradient(circle, color-mix(in srgb, ${accent ?? "var(--primary)"} 45%, transparent), transparent 70%)`,
              }}
              aria-hidden
            />
            <h2 className="relative font-display text-[clamp(28px,3.6vw,46px)] font-bold tracking-[-0.03em]">
              {t.contact.title}
            </h2>
            <p className="relative mx-auto mt-4 max-w-[480px] text-[17px] leading-[1.6] text-background/65">
              {t.contact.sub}
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3.5">
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: accent ?? "var(--primary)" }}
                >
                  <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2} />
                  {t.contact.whatsapp}
                </a>
              )}
              {site.email && (
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-background/25 px-6 py-3.5 text-[15px] font-semibold text-background transition-colors hover:bg-background/10"
                >
                  <Mail className="h-[18px] w-[18px]" strokeWidth={2} />
                  {t.contact.email}
                </a>
              )}
              {site.phone && (
                <a
                  href={`tel:${site.phone.replace(/\D/g, "")}`}
                  className="inline-flex items-center gap-2 rounded-full border border-background/25 px-6 py-3.5 text-[15px] font-semibold text-background transition-colors hover:bg-background/10"
                >
                  <Phone className="h-[18px] w-[18px]" strokeWidth={2} />
                  {site.phone}
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-5 py-6 md:px-8">
          <p className="text-[13px] text-muted-foreground">
            © {new Date().getFullYear()} · {agent.name}
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              {lang === "es" ? "Hecho con" : "Made with"}
              <span className="font-display font-bold text-foreground">
                estaila
                <span style={{ color: accent ?? "var(--primary)" }}>.</span>
              </span>
            </span>
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// PROPERTY CARD
// ============================================================

function PropertyCard({
  p,
  delay,
  slug,
  lang,
  t,
  accent,
}: {
  p: PortalData["properties"][0];
  delay: number;
  slug: string;
  lang: "es" | "en";
  t: Copy;
  accent?: string;
}) {
  const reduced = useReducedMotion();
  const price = p.priceUSD
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(p.priceUSD)
    : null;

  const isRent = p.operation === "EN_ALQUILER";

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
    >
      <Link
        href={`/p/${slug}/${p.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {p.featuredPhoto ? (
            <Image
              src={p.featuredPhoto}
              alt={p.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-10 w-10 text-muted-foreground/40" strokeWidth={1} />
            </div>
          )}
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 font-display text-[11px] font-bold text-white"
            style={{ background: accent ?? "var(--primary)" }}
          >
            {isRent ? (lang === "es" ? "Alquiler" : "Rental") : lang === "es" ? "Venta" : "Sale"}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-1 font-display text-base font-bold tracking-tight">
            {p.title}
          </h3>
          {p.location && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" strokeWidth={1.75} />
              <span className="line-clamp-1">{p.location}</span>
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
            {p.bedrooms !== null && p.bedrooms > 0 && <span>{p.bedrooms} hab</span>}
            {p.bathrooms !== null && p.bathrooms !== undefined && (
              <span>{p.bathrooms} baños</span>
            )}
            {p.parking !== null && p.parking !== undefined && p.parking > 0 && (
              <span>{p.parking} parq</span>
            )}
            {p.metersSquared && <span>{p.metersSquared} m²</span>}
          </div>

          <div className="mt-auto flex items-end justify-between pt-5">
            <div>
              {price ? (
                <p className="font-display text-lg font-bold tabular-nums tracking-tight">
                  {price}
                  {isRent && (
                    <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                      {t.rentSuffix}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{t.inquire}</p>
              )}
            </div>
            <ArrowUpRight
              className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.75}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================
// SHARED ATOMS
// ============================================================

function HeroStat({ n, l, accent }: { n: number; l: string; accent?: string }) {
  return (
    <div className="flex flex-col">
      <span
        className="font-display text-[clamp(26px,3vw,36px)] font-bold leading-none tracking-[-0.03em]"
        style={{ color: accent ?? "var(--primary)" }}
      >
        {n}
      </span>
      <span className="mt-1 text-[13px] text-muted-foreground">{l}</span>
    </div>
  );
}

function Eyebrow({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <p
      className="font-display text-[12.5px] font-semibold uppercase tracking-[0.12em]"
      style={{ color: accent ?? "var(--primary)" }}
    >
      {children}
    </p>
  );
}
