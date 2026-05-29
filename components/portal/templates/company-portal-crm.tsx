"use client";

/**
 * Company portal /p/[slug] — handoff "Sitio Empresa" (brokerage) design.
 * Rendered when the agent's Organization has white-label enabled.
 * Theme-aware + org branding via site.primaryColor. Team from org members.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Building2,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  Wand2,
} from "lucide-react";
import { LanguageProvider, useLang } from "@/components/marketing-site/language-context";
import { LangToggle } from "@/components/marketing-site/lang-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PortalData, PortalProperty } from "../types";

export function CompanyPortalCrm(props: PortalData) {
  return (
    <LanguageProvider>
      <CompanyContent {...props} />
    </LanguageProvider>
  );
}

const COPY = {
  es: {
    nav: { props: "Propiedades", team: "Equipo", contact: "Contacto", cta: "Contactar" },
    hero: {
      badge: (n: number) => `${n} ${n === 1 ? "propiedad disponible" : "propiedades disponibles"}`,
      h1a: "La propiedad correcta,",
      h1b: "con el equipo correcto.",
      sub: "Compra, vende o alquila con asesores que conocen el mercado a fondo.",
      opAll: "Todas",
      opSale: "Comprar",
      opRent: "Alquilar",
      where: "Ubicación",
      search: "Buscar",
    },
    listings: { eyebrow: "DESTACADAS", title: "Propiedades de la semana", empty: "Catálogo en preparación", inquire: "Consultar", rent: " / mes" },
    stats: { props: "Propiedades activas", team: "Asesores", coverage: "Cobertura nacional" },
    why: {
      eyebrow: "POR QUÉ NOSOTROS",
      title: "Tecnología, experiencia y un equipo cercano.",
      items: [
        ["Transacciones seguras", "Acompañamiento legal y financiero en cada cierre."],
        ["Marketing con IA", "Tus propiedades publicadas en minutos, con fotos mejoradas."],
        ["Cobertura amplia", "Presencia en las zonas de mayor demanda."],
        ["Asesores expertos", "Profesionales que conocen cada zona a fondo."],
        ["Datos del mercado", "Te asesoramos con precios reales y tendencias."],
        ["Atención cercana", "Te respondemos en tu idioma, cuando lo necesites."],
      ] as [string, string][],
    },
    team: { eyebrow: "EQUIPO", title: "Asesores que te acompañan" },
    cta: { title: "¿Quieres vender tu propiedad?", sub: "Publícala con nosotros y llega a miles de compradores con marketing impulsado por IA.", btn: "Hablar con un asesor" },
  },
  en: {
    nav: { props: "Properties", team: "Team", contact: "Contact", cta: "Contact" },
    hero: {
      badge: (n: number) => `${n} ${n === 1 ? "property available" : "properties available"}`,
      h1a: "The right property,",
      h1b: "with the right team.",
      sub: "Buy, sell or rent with advisors who know the market inside out.",
      opAll: "All",
      opSale: "Buy",
      opRent: "Rent",
      where: "Location",
      search: "Search",
    },
    listings: { eyebrow: "FEATURED", title: "Properties of the week", empty: "Catalog in preparation", inquire: "Inquire", rent: " / mo" },
    stats: { props: "Active properties", team: "Advisors", coverage: "Nationwide coverage" },
    why: {
      eyebrow: "WHY US",
      title: "Technology, experience and a team that's close.",
      items: [
        ["Secure transactions", "Legal and financial support at every closing."],
        ["AI marketing", "Your listings published in minutes, with enhanced photos."],
        ["Wide coverage", "Presence in the highest-demand areas."],
        ["Expert advisors", "Professionals who know every area in depth."],
        ["Market data", "We advise you with real prices and trends."],
        ["Close support", "We reply in your language, whenever you need."],
      ] as [string, string][],
    },
    team: { eyebrow: "TEAM", title: "Advisors by your side" },
    cta: { title: "Want to sell your property?", sub: "List it with us and reach thousands of buyers with AI-powered marketing.", btn: "Talk to an advisor" },
  },
};

const WHY_ICONS = [ShieldCheck, Wand2, Globe, Users, TrendingUp, Phone];

function CompanyContent({ site, agent, properties, team = [] }: PortalData) {
  const { lang } = useLang();
  const t = COPY[lang];
  const accent = site.primaryColor || undefined;
  const companyName = site.title ?? agent.name;
  const initials =
    companyName
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "—";

  const active = properties.filter(
    (p) => p.status !== "VENDIDA" && p.status !== "ALQUILADA"
  );
  const [op, setOp] = useState<"ALL" | "EN_VENTA" | "EN_ALQUILER">("ALL");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let arr = active;
    if (op !== "ALL") arr = arr.filter((p) => p.operation === op);
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.location?.toLowerCase().includes(s)
      );
    }
    return arr;
  }, [active, op, q]);

  const waHref = site.whatsapp
    ? `https://wa.me/${site.whatsapp.replace(/\D/g, "")}`
    : null;

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground">
      {/* ===================== NAV ===================== */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3.5 md:px-10">
          <Link href={`/p/${site.slug}`} className="flex items-center gap-2.5">
            {site.logoUrl ? (
              <Image src={site.logoUrl} alt={companyName} width={40} height={40} className="h-10 w-10 rounded-[11px] object-cover" />
            ) : (
              <span
                className="grid h-10 w-10 place-items-center rounded-[11px] font-display text-lg font-bold text-white"
                style={{ background: accent ?? "var(--primary)" }}
              >
                {initials.charAt(0)}
              </span>
            )}
            <span className="font-display text-lg font-bold tracking-tight">{companyName}</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <button onClick={() => scrollTo("listings")} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t.nav.props}
            </button>
            {team.length > 0 && (
              <button onClick={() => scrollTo("team")} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {t.nav.team}
              </button>
            )}
            <button onClick={() => scrollTo("contact")} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t.nav.contact}
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            {waHref && (
              <Button asChild size="sm" style={accent ? { background: accent } : undefined}>
                <a href={waHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-1 h-3.5 w-3.5" strokeWidth={2} />
                  {t.nav.cta}
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ===================== HERO + SEARCH ===================== */}
        <section className="border-b border-border/60 bg-card/30">
          <div className="mx-auto max-w-[1200px] px-5 py-[clamp(48px,6vw,88px)] md:px-10">
            <div className="max-w-[720px]">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-display text-[13px] font-semibold"
                style={{
                  color: accent ?? "var(--primary)",
                  background: `color-mix(in srgb, ${accent ?? "var(--primary)"} 9%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${accent ?? "var(--primary)"} 20%, transparent)`,
                }}
              >
                <Building2 className="h-4 w-4" strokeWidth={2} />
                {t.hero.badge(active.length)}
              </span>
              <h1 className="mt-5 font-display text-[clamp(34px,5vw,60px)] font-bold leading-[1.02] tracking-[-0.035em]">
                {t.hero.h1a}{" "}
                <span style={{ color: accent ?? "var(--primary)" }}>{t.hero.h1b}</span>
              </h1>
              <p className="mt-5 max-w-[540px] text-[clamp(16px,1.4vw,19px)] leading-[1.6] text-muted-foreground">
                {site.tagline ?? site.about ?? t.hero.sub}
              </p>
            </div>

            {/* search bar */}
            <div className="mt-9 flex flex-col gap-3 rounded-2xl border border-border bg-background p-2.5 shadow-md sm:flex-row sm:items-center">
              <div className="flex gap-1 rounded-xl bg-card p-1">
                {([["ALL", t.hero.opAll], ["EN_VENTA", t.hero.opSale], ["EN_ALQUILER", t.hero.opRent]] as const).map(
                  ([v, label]) => (
                    <button
                      key={v}
                      onClick={() => setOp(v)}
                      className={cn(
                        "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                        op === v ? "text-white" : "text-muted-foreground hover:text-foreground"
                      )}
                      style={op === v ? { background: accent ?? "var(--primary)" } : undefined}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t.hero.where}
                  className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <Button
                size="lg"
                className="h-11 shrink-0"
                style={accent ? { background: accent } : undefined}
                onClick={() => scrollTo("listings")}
              >
                <Search className="mr-1.5 h-4 w-4" strokeWidth={2} />
                {t.hero.search}
              </Button>
            </div>
          </div>
        </section>

        {/* ===================== LISTINGS ===================== */}
        <section id="listings" className="scroll-mt-16 px-5 py-[clamp(48px,6vw,88px)] md:px-10">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-9">
              <Eyebrow accent={accent}>{t.listings.eyebrow}</Eyebrow>
              <h2 className="mt-2.5 font-display text-[clamp(28px,3.4vw,42px)] font-bold tracking-[-0.03em]">
                {t.listings.title}
              </h2>
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
                <p className="text-base text-muted-foreground">{t.listings.empty}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p, i) => (
                  <CompanyCard key={p.id} p={p} slug={site.slug} accent={accent} t={t} delay={Math.min(i, 8) * 0.05} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ===================== STATS BAND ===================== */}
        <section className="bg-foreground text-background">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-5 py-[clamp(40px,5vw,64px)] sm:grid-cols-3 md:px-10">
            <StatBig n={String(active.length)} l={t.stats.props} accent={accent} />
            <StatBig n={String(team.length || 1)} l={t.stats.team} accent={accent} />
            <StatBig n="RD" l={t.stats.coverage} accent={accent} />
          </div>
        </section>

        {/* ===================== WHY US ===================== */}
        <section className="px-5 py-[clamp(48px,6vw,88px)] md:px-10">
          <div className="mx-auto max-w-[1200px]">
            <div className="mx-auto mb-12 max-w-[640px] text-center">
              <Eyebrow accent={accent} center>{t.why.eyebrow}</Eyebrow>
              <h2 className="mt-3 font-display text-[clamp(28px,3.4vw,44px)] font-bold tracking-[-0.03em]">
                {t.why.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {t.why.items.map(([title, body], i) => {
                const Icon = WHY_ICONS[i] ?? ShieldCheck;
                return (
                  <div key={title} className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/20">
                    <span
                      className="mb-4 grid h-12 w-12 place-items-center rounded-xl"
                      style={{
                        background: `color-mix(in srgb, ${accent ?? "var(--primary)"} 10%, transparent)`,
                        color: accent ?? "var(--primary)",
                      }}
                    >
                      <Icon className="h-[23px] w-[23px]" strokeWidth={1.75} />
                    </span>
                    <div className="font-display text-lg font-semibold tracking-tight">{title}</div>
                    <p className="mt-2 text-[14.5px] leading-[1.55] text-muted-foreground">{body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================== TEAM ===================== */}
        {team.length > 0 && (
          <section id="team" className="scroll-mt-16 border-y border-border/60 bg-card/30 px-5 py-[clamp(48px,6vw,88px)] md:px-10">
            <div className="mx-auto max-w-[1200px]">
              <div className="mb-12 text-center">
                <Eyebrow accent={accent} center>{t.team.eyebrow}</Eyebrow>
                <h2 className="mt-3 font-display text-[clamp(28px,3.4vw,44px)] font-bold tracking-[-0.03em]">
                  {t.team.title}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {team.map((m, i) => (
                  <div key={`${m.name}-${i}`} className="rounded-2xl border border-border bg-background p-6 text-center">
                    {m.image ? (
                      <Image src={m.image} alt={m.name} width={84} height={84} className="mx-auto h-[84px] w-[84px] rounded-full object-cover" />
                    ) : (
                      <span
                        className="mx-auto grid h-[84px] w-[84px] place-items-center rounded-full font-display text-xl font-bold text-white"
                        style={{ background: accent ?? "var(--primary)" }}
                      >
                        {m.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                      </span>
                    )}
                    <div className="mt-4 font-display text-base font-semibold tracking-tight">{m.name}</div>
                    {m.role && <div className="mt-0.5 text-[13px] text-muted-foreground">{m.role}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===================== CTA ===================== */}
        <section id="contact" className="scroll-mt-16 px-5 py-[clamp(48px,6vw,88px)] md:px-10">
          <div
            className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-8 rounded-[26px] px-[clamp(28px,5vw,64px)] py-[clamp(36px,5vw,64px)] text-white sm:grid-cols-[1fr_auto]"
            style={{ background: accent ?? "var(--primary)" }}
          >
            <div>
              <h2 className="font-display text-[clamp(28px,3.6vw,46px)] font-bold tracking-[-0.03em]">
                {t.cta.title}
              </h2>
              <p className="mt-3.5 max-w-[480px] text-[17px] leading-[1.55] text-white/90">
                {t.cta.sub}
              </p>
            </div>
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-[15px] font-semibold text-background transition-transform hover:scale-[1.02]"
              >
                <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2} />
                {t.cta.btn}
              </a>
            ) : site.email ? (
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-[15px] font-semibold text-background transition-transform hover:scale-[1.02]"
              >
                <Mail className="h-[18px] w-[18px]" strokeWidth={2} />
                {t.cta.btn}
              </a>
            ) : null}
          </div>
        </section>
      </main>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-7 md:px-10">
          <div>
            <div className="font-display text-lg font-bold tracking-tight">{companyName}</div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              © {new Date().getFullYear()} · {lang === "es" ? "Todos los derechos reservados" : "All rights reserved"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              {lang === "es" ? "Hecho con" : "Made with"}
              <span className="font-display font-bold text-foreground">
                estaila<span style={{ color: accent ?? "var(--primary)" }}>.</span>
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
// COMPANY PROPERTY CARD
// ============================================================

function CompanyCard({
  p,
  slug,
  accent,
  t,
  delay,
}: {
  p: PortalProperty;
  slug: string;
  accent?: string;
  t: typeof COPY.es;
  delay: number;
}) {
  const reduced = useReducedMotion();
  const price = p.priceUSD
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(p.priceUSD)
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
            {isRent ? t.hero.opRent : t.hero.opSale}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="font-display text-lg font-bold tracking-tight">
            {price ?? <span className="text-base text-muted-foreground">{t.listings.inquire}</span>}
            {price && isRent && (
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">{t.listings.rent}</span>
            )}
          </div>
          <h3 className="mt-1 line-clamp-1 font-display text-[15px] font-semibold tracking-tight">{p.title}</h3>
          {p.location && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" strokeWidth={1.75} />
              <span className="line-clamp-1">{p.location}</span>
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
            {p.bedrooms !== null && p.bedrooms > 0 && <span>{p.bedrooms} hab</span>}
            {p.bathrooms !== null && <span>{p.bathrooms} baños</span>}
            {p.metersSquared && <span>{p.metersSquared} m²</span>}
            <ArrowUpRight className="ml-auto h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================
// ATOMS
// ============================================================

function StatBig({ n, l, accent }: { n: string; l: string; accent?: string }) {
  return (
    <div>
      <div
        className="font-display text-[clamp(32px,4vw,52px)] font-bold leading-none tracking-[-0.03em]"
        style={{ color: accent ?? "var(--primary)" }}
      >
        {n}
      </div>
      <p className="mt-2 text-[14.5px] text-background/60">{l}</p>
    </div>
  );
}

function Eyebrow({
  children,
  accent,
  center,
}: {
  children: React.ReactNode;
  accent?: string;
  center?: boolean;
}) {
  return (
    <p
      className={cn(
        "font-display text-[12.5px] font-semibold uppercase tracking-[0.12em]",
        center && "flex items-center justify-center"
      )}
      style={{ color: accent ?? "var(--primary)" }}
    >
      {children}
    </p>
  );
}
