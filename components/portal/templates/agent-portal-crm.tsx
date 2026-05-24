"use client";

/**
 * Agent portal /p/[slug] — aligned with CRM panel design language.
 * Same tokens (bg-background, primary blue, bg-card border) as the dashboard.
 */

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import { LanguageProvider, useLang } from "@/components/marketing-site/language-context";
import { LangToggle } from "@/components/marketing-site/lang-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
      kicker: "Portal del agente",
      greet: "Hola, soy",
      sub: "Mi catálogo activo y la mejor forma de hablarme.",
      cta: "Ver propiedades",
      ctaAlt: "Hablar conmigo",
    },
    catalog: {
      eyebrow: "CATÁLOGO ACTIVO",
      title: "Propiedades disponibles",
      sub: "Selección actual. Para opciones fuera de cartera, escríbeme.",
      empty: "Catálogo en preparación",
      filterAll: "Todas",
      filterSale: "Venta",
      filterRent: "Alquiler",
    },
    contact: {
      eyebrow: "CONTACTO",
      title: "Conversemos.",
      sub: "WhatsApp es el canal más rápido. Respondo el mismo día.",
      whatsapp: "WhatsApp",
      email: "Email",
      phone: "Teléfono",
    },
    about: { eyebrow: "SOBRE MÍ", title: "Mi propuesta." },
    inquire: "Consultar",
    perMonth: "/ mes",
    rentSuffix: " / mes",
  },
  en: {
    nav: { catalog: "Properties", about: "About", contact: "Contact" },
    hero: {
      kicker: "Agent portal",
      greet: "Hi, I'm",
      sub: "My active catalog and the fastest way to reach me.",
      cta: "Browse properties",
      ctaAlt: "Talk to me",
    },
    catalog: {
      eyebrow: "ACTIVE CATALOG",
      title: "Available properties",
      sub: "Current selection. For off-list options, message me.",
      empty: "Catalog in preparation",
      filterAll: "All",
      filterSale: "Sale",
      filterRent: "Rental",
    },
    contact: {
      eyebrow: "CONTACT",
      title: "Let's talk.",
      sub: "WhatsApp is fastest. I reply same-day.",
      whatsapp: "WhatsApp",
      email: "Email",
      phone: "Phone",
    },
    about: { eyebrow: "ABOUT", title: "My approach." },
    inquire: "Inquire",
    perMonth: "/ mo",
    rentSuffix: " / mo",
  },
};

type Copy = typeof COPY.es;

function PortalContent({ site, agent, properties }: PortalData) {
  const { lang } = useLang();
  const t = COPY[lang];
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3 md:px-8">
          <Link href={`/p/${site.slug}`} className="flex items-center gap-2.5">
            {site.logoUrl ? (
              <Image
                src={site.logoUrl}
                alt={agent.name}
                width={28}
                height={28}
                className="rounded-md object-cover"
              />
            ) : (
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md text-primary-foreground"
                style={{ background: site.primaryColor ?? "var(--primary)" }}
              >
                <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
              </div>
            )}
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">
                {site.title ?? agent.name}
              </span>
              <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {t.hero.kicker}
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#catalog" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t.nav.catalog}
            </a>
            {site.about && (
              <a href="#about" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                {t.nav.about}
              </a>
            )}
            <a href="#contact" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t.nav.contact}
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            {site.whatsapp && (
              <Button asChild size="sm">
                <a
                  href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-1 h-3.5 w-3.5" strokeWidth={2} />
                  {t.contact.whatsapp}
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border/60 px-5 py-20 md:px-8 md:py-28">
          <div className="ambient-glow" aria-hidden />
          <div className="absolute inset-0 bg-dots opacity-50" aria-hidden />

          <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="lg:col-span-7">
              <Badge
                variant="secondary"
                className="gap-1.5 border border-border bg-card/60 text-[11px] text-muted-foreground"
              >
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" strokeWidth={0} />
                {t.hero.kicker}
              </Badge>
              <h1 className="mt-6 text-[clamp(40px,7vw,80px)] font-semibold leading-[1.02] tracking-[-0.035em]">
                {t.hero.greet}{" "}
                <span
                  className="italic text-primary"
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontWeight: 500,
                  }}
                >
                  {firstName}
                </span>
                <span className="text-muted-foreground">.</span>
              </h1>
              {site.tagline ? (
                <p className="mt-5 max-w-[52ch] text-base text-muted-foreground md:text-lg">
                  {site.tagline}
                </p>
              ) : (
                <p className="mt-5 max-w-[52ch] text-base text-muted-foreground md:text-lg">
                  {t.hero.sub}
                </p>
              )}
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-11 px-6">
                  <a href="#catalog">
                    {t.hero.cta}
                    <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2} />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-11 px-6">
                  <a href="#contact">{t.hero.ctaAlt}</a>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
                <Stat n={active.length} l={lang === "es" ? "Activas" : "Active"} />
                <Stat n={properties.length} l={lang === "es" ? "Total" : "Total"} />
                {site.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3 w-3" strokeWidth={1.75} />
                    {site.email}
                  </span>
                )}
              </div>
            </div>

            {/* Agent card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-border bg-card p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  {agent.image ? (
                    <Image
                      src={agent.image}
                      alt={agent.name}
                      width={68}
                      height={68}
                      className="h-16 w-16 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-xl font-semibold text-primary">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-lg font-semibold tracking-tight">{agent.name}</p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                      estaila × {site.slug.toUpperCase()}
                    </p>
                  </div>
                </div>
                <ul className="mt-6 space-y-2.5 border-t border-border pt-5 text-sm">
                  {site.whatsapp && (
                    <ContactRow
                      icon={MessageCircle}
                      label="WhatsApp"
                      value={site.whatsapp}
                      href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                    />
                  )}
                  {site.email && (
                    <ContactRow
                      icon={Mail}
                      label="Email"
                      value={site.email}
                      href={`mailto:${site.email}`}
                    />
                  )}
                  {site.phone && (
                    <ContactRow
                      icon={Phone}
                      label="Tel"
                      value={site.phone}
                      href={`tel:${site.phone.replace(/\D/g, "")}`}
                    />
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CATALOG */}
        <section id="catalog" className="relative border-b border-border/60 px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-[1280px]">
            <SectionHead eyebrow={t.catalog.eyebrow} title={t.catalog.title} sub={t.catalog.sub} />

            {active.length === 0 ? (
              <div className="mt-14 rounded-xl border border-dashed border-border bg-card/40 p-16 text-center">
                <p className="text-base text-muted-foreground">{t.catalog.empty}</p>
              </div>
            ) : (
              <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((p, i) => (
                  <PropertyCard
                    key={p.id}
                    p={p}
                    delay={Math.min(i, 8) * 0.05}
                    slug={site.slug}
                    lang={lang}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ABOUT */}
        {site.about && (
          <section id="about" className="relative border-b border-border/60 bg-card/20 px-5 py-24 md:px-8 md:py-32">
            <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-4">
                <Eyebrow>{t.about.eyebrow}</Eyebrow>
                <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                  {t.about.title}
                </h2>
              </div>
              <div className="lg:col-span-8">
                <p
                  className="text-lg leading-relaxed text-foreground/90 md:text-xl"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
                >
                  <span className="text-3xl text-primary">“</span>
                  {site.about}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* CONTACT */}
        <section id="contact" className="relative overflow-hidden border-b border-border/60 px-5 py-24 md:px-8 md:py-32">
          <div className="ambient-glow opacity-60" aria-hidden />
          <div className="relative mx-auto grid max-w-[1180px] grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
            <div className="lg:col-span-6">
              <Eyebrow>{t.contact.eyebrow}</Eyebrow>
              <h2 className="mt-3 text-[clamp(36px,6vw,68px)] font-semibold leading-[1.05] tracking-[-0.03em]">
                {t.contact.title.replace(".", "")}
                <span
                  className="italic text-primary"
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontWeight: 500,
                  }}
                >
                  .
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
                    label={t.contact.whatsapp}
                    value={site.whatsapp}
                    href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                  />
                )}
                {site.email && (
                  <ContactBigRow
                    icon={Mail}
                    label={t.contact.email}
                    value={site.email}
                    href={`mailto:${site.email}`}
                  />
                )}
                {site.phone && (
                  <ContactBigRow
                    icon={Phone}
                    label={t.contact.phone}
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
// PROPERTY CARD
// ============================================================

function PropertyCard({
  p,
  delay,
  slug,
  lang,
  t,
}: {
  p: PortalData["properties"][0];
  delay: number;
  slug: string;
  lang: "es" | "en";
  t: Copy;
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
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-foreground/20 hover:shadow-lg"
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
          <Badge
            variant="secondary"
            className={cn(
              "absolute left-3 top-3 border text-[10px] font-medium uppercase tracking-wider backdrop-blur",
              isRent
                ? "border-amber-500/30 bg-amber-500/15 text-amber-600"
                : "border-emerald-500/30 bg-emerald-500/15 text-emerald-600"
            )}
          >
            {isRent
              ? lang === "es"
                ? "Alquiler"
                : "Rental"
              : lang === "es"
              ? "Venta"
              : "Sale"}
          </Badge>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-1 text-base font-semibold tracking-tight">{p.title}</h3>
          {p.location && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" strokeWidth={1.75} />
              <span className="line-clamp-1">{p.location}</span>
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
            {p.bedrooms !== null && p.bedrooms > 0 && (
              <span>{p.bedrooms} hab</span>
            )}
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
                <p className="font-mono text-lg font-semibold tabular-nums tracking-tight">
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
              className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
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

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-mono text-base font-semibold tabular-nums text-foreground">{n}</span>
      <span>{l}</span>
    </span>
  );
}

function ContactRow({
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
      <a href={href} target="_blank" rel="noreferrer" className="group flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors group-hover:text-primary">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-medium">{value}</p>
        </div>
        <ArrowUpRight
          className="h-3.5 w-3.5 text-muted-foreground/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
          strokeWidth={1.75}
        />
      </a>
    </li>
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

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-[720px] text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.025em] md:text-5xl">
        {title}
      </h2>
      {sub && (
        <p className="mx-auto mt-5 max-w-[56ch] text-base text-muted-foreground md:text-lg">
          {sub}
        </p>
      )}
    </div>
  );
}
