"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Bath,
  Bed,
  Camera,
  Mail,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
} from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PortalData, PortalProperty } from "../types";
import {
  agentDisplayName,
  buildWhatsAppLink,
  portalFormatCurrency,
} from "../shared";

// ============================================================
// AgentPortal — Editorial Minimalist (Aesop / Sotheby's / Modus)
// Cream off-white. Serif italic display. Big photos. Asymmetric.
// One accent (ink). Slow deliberate animations.
// ============================================================

const PALETTE = {
  bg: "#F5F2EC",        // warm off-white
  bgInverse: "#0E0E0C", // deep ink (footer + accents)
  fg: "#111110",        // primary text
  fgMuted: "#6B6862",   // secondary
  hairline: "#D9D4CA",  // borders
  accent: "#8B7355",    // discreet warm brown
};

export function AgentPortal({ site, agent, properties }: PortalData) {
  const brand = site.title ?? agentDisplayName(site, agent);
  const wa = buildWhatsAppLink(site);

  return (
    <div
      className="min-h-screen antialiased"
      style={{
        backgroundColor: PALETTE.bg,
        color: PALETTE.fg,
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      <Nav site={site} brand={brand} />
      <Hero site={site} brand={brand} properties={properties} />
      <Manifesto brand={brand} site={site} />
      <PropertyIndex properties={properties} site={site} />
      <FeaturedSpread properties={properties} site={site} />
      <Process brand={brand} />
      <Contact site={site} brand={brand} wa={wa} />
      <Footer site={site} brand={brand} />
    </div>
  );
}

// ============================================================
// NAV — minimal, almost invisible
// ============================================================

function Nav({ site, brand }: { site: PortalData["site"]; brand: string }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-500"
      style={{
        backgroundColor: scrolled ? "rgba(245, 242, 236, 0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid ${PALETTE.hairline}` : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 lg:px-12">
        <Link
          href={`/p/${site.slug}`}
          className="inline-flex items-center gap-2.5"
          aria-label={brand}
        >
          {site.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={site.logoUrl}
              alt={brand}
              className="h-8 w-8 rounded-sm object-cover"
            />
          ) : null}
          <span
            className="text-base font-medium tracking-tight"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              color: scrolled ? PALETTE.fg : "white",
              fontSize: "20px",
              textShadow: scrolled ? "none" : "0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            {brand}
          </span>
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-8 md:flex"
        >
          {[
            { href: "#index", label: "Propiedades" },
            { href: "#process", label: "Método" },
            { href: "#contact", label: "Contacto" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-xs uppercase tracking-[0.2em] transition-opacity hover:opacity-60"
              style={{
                color: scrolled ? PALETTE.fg : "white",
                textShadow: scrolled ? "none" : "0 1px 3px rgba(0,0,0,0.4)",
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {site.phone && (
          <a
            href={`tel:${site.phone}`}
            className="hidden text-xs font-mono tabular-nums transition-opacity hover:opacity-60 sm:inline-block"
            style={{
              color: scrolled ? PALETTE.fg : "white",
              textShadow: scrolled ? "none" : "0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            {site.phone}
          </a>
        )}
      </div>
    </header>
  );
}

// ============================================================
// HERO — single full-bleed photo, title overlay
// ============================================================

function Hero({
  site,
  brand,
  properties,
}: {
  site: PortalData["site"];
  brand: string;
  properties: PortalProperty[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 180]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);

  const heroPhoto = site.coverUrl ?? properties[0]?.featuredPhoto ?? null;

  return (
    <section
      ref={ref}
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden"
    >
      <motion.div style={{ y, scale }} className="absolute inset-0" aria-hidden>
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroPhoto} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: "linear-gradient(135deg, #2a2520 0%, #4a3f33 50%, #1a1614 100%)",
            }}
          />
        )}
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-black/55" />

      {/* Top-right location chip */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute right-6 top-24 z-10 lg:right-12 lg:top-28"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/85">
          {properties[0]?.location ?? "Premium properties"}
        </span>
      </motion.div>

      {/* Title bottom-left */}
      <div className="absolute inset-x-6 bottom-12 z-10 lg:inset-x-12 lg:bottom-16">
        <div className="max-w-5xl">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 text-[10px] uppercase tracking-[0.4em] text-white/75"
          >
            <span className="mr-3 inline-block h-px w-10 align-middle bg-white/60" />
            {properties.length} propiedades curadas
          </motion.p>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance text-white"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(48px, 10vw, 160px)",
              fontWeight: 300,
              lineHeight: 0.9,
              letterSpacing: "-0.02em",
            }}
          >
            {site.tagline ? (
              <>
                {site.tagline.split(/\s+/).slice(0, -1).join(" ")}{" "}
                <em className="italic" style={{ color: "#E8DCC8" }}>
                  {site.tagline.split(/\s+/).slice(-1)[0]}.
                </em>
              </>
            ) : (
              <>
                Casas que{" "}
                <em className="italic" style={{ color: "#E8DCC8" }}>
                  perduran.
                </em>
              </>
            )}
          </motion.h1>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 hidden items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-white/65 lg:flex"
          aria-hidden
        >
          <span>Explorar</span>
          <ArrowDownRight className="h-3 w-3" />
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// MANIFESTO — short serif statement, single column
// ============================================================

function Manifesto({
  brand,
  site,
}: {
  brand: string;
  site: PortalData["site"];
}) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-28 lg:px-12 lg:py-40">
      <p
        className="mb-5 text-[10px] uppercase tracking-[0.4em]"
        style={{ color: PALETTE.accent }}
      >
        <span className="mr-3 inline-block h-px w-10 align-middle" style={{ background: PALETTE.accent }} />
        Manifiesto
      </p>
      <h2
        className="text-balance"
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: "clamp(28px, 4vw, 48px)",
          fontWeight: 300,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
        }}
      >
        {site.about ? (
          site.about
        ) : (
          <>
            En {brand} no buscamos clientes. Buscamos personas que entiendan
            que <em className="italic" style={{ color: PALETTE.accent }}>una casa bien elegida</em> es una decisión que dura
            generaciones.
          </>
        )}
      </h2>
    </section>
  );
}

// ============================================================
// PROPERTY INDEX — numbered list, no photos, magazine feel
// ============================================================

function PropertyIndex({
  properties,
  site,
}: {
  properties: PortalProperty[];
  site: PortalData["site"];
}) {
  if (properties.length === 0) return null;

  return (
    <section
      id="index"
      className="border-t border-b py-20 lg:py-28"
      style={{ borderColor: PALETTE.hairline }}
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-12 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p
              className="mb-3 text-[10px] uppercase tracking-[0.4em]"
              style={{ color: PALETTE.accent }}
            >
              Índice · Vol. {new Date().getFullYear()}
            </p>
            <h2
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "clamp(32px, 5vw, 64px)",
                fontWeight: 300,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              Propiedades.
            </h2>
          </div>
          <p
            className="font-mono text-xs tabular-nums"
            style={{ color: PALETTE.fgMuted }}
          >
            {String(properties.length).padStart(2, "0")} entries
          </p>
        </div>

        <ul>
          {properties.map((p, i) => (
            <IndexRow key={p.id} property={p} index={i} site={site} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function IndexRow({
  property,
  index,
  site,
}: {
  property: PortalProperty;
  index: number;
  site: PortalData["site"];
}) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.6, delay: index * 0.04 }}
    >
      <Link
        href={`/p/${site.slug}/${property.id}`}
        className="group grid grid-cols-[40px_1fr_auto] items-center gap-4 border-t py-6 transition-colors sm:grid-cols-[60px_2fr_1fr_auto] sm:gap-8"
        style={{ borderColor: PALETTE.hairline }}
      >
        {/* Number */}
        <span
          className="font-mono text-xs tabular-nums transition-colors group-hover:text-[var(--accent)]"
          style={{ color: PALETTE.fgMuted }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Title + location */}
        <div className="min-w-0">
          <p
            className="truncate transition-colors group-hover:italic"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(20px, 2.5vw, 32px)",
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            {property.title}
          </p>
          {property.location && (
            <p
              className="mt-1 text-xs uppercase tracking-[0.2em]"
              style={{ color: PALETTE.fgMuted }}
            >
              {property.location}
            </p>
          )}
        </div>

        {/* Price — desktop only */}
        <p
          className="hidden font-mono text-sm tabular-nums sm:block"
          style={{ color: PALETTE.fg }}
        >
          {portalFormatCurrency(
            property.priceUSD ?? property.priceDOP,
            property.priceUSD ? "USD" : "DOP"
          )}
        </p>

        {/* Arrow */}
        <ArrowUpRight
          className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
          style={{ color: PALETTE.fgMuted }}
          strokeWidth={1.25}
          aria-hidden
        />
      </Link>
    </motion.li>
  );
}

// ============================================================
// FEATURED SPREAD — 2-3 hero-sized photos with magazine captions
// ============================================================

function FeaturedSpread({
  properties,
  site,
}: {
  properties: PortalProperty[];
  site: PortalData["site"];
}) {
  const items = properties.slice(0, 3).filter((p) => p.featuredPhoto);
  if (items.length === 0) return null;

  return (
    <section className="py-28 lg:py-40">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <p
          className="mb-3 text-[10px] uppercase tracking-[0.4em]"
          style={{ color: PALETTE.accent }}
        >
          <span className="mr-3 inline-block h-px w-10 align-middle" style={{ background: PALETTE.accent }} />
          Selección destacada
        </p>
        <h2
          className="mb-16 text-balance"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 300,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          Tres propiedades, tres{" "}
          <em className="italic" style={{ color: PALETTE.accent }}>
            historias
          </em>
          .
        </h2>

        <div className="space-y-28 lg:space-y-40">
          {items.map((p, i) => (
            <FeaturedItem key={p.id} property={p} index={i} site={site} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedItem({
  property,
  index,
  site,
}: {
  property: PortalProperty;
  index: number;
  site: PortalData["site"];
}) {
  const reduce = useReducedMotion();
  const flip = index % 2 === 1;
  return (
    <article
      className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-20 ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-[4/5] overflow-hidden bg-[#e8e3da]"
      >
        {property.featuredPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.featuredPhoto}
            alt={property.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.15 }}
      >
        <p
          className="mb-3 font-mono text-xs tabular-nums uppercase tracking-[0.3em]"
          style={{ color: PALETTE.accent }}
        >
          N° {String(index + 1).padStart(2, "0")}
        </p>
        <h3
          className="text-balance"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(28px, 4vw, 48px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
          }}
        >
          {property.title}
        </h3>
        {property.location && (
          <p
            className="mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em]"
            style={{ color: PALETTE.fgMuted }}
          >
            <MapPin className="h-3 w-3" strokeWidth={1.25} aria-hidden />
            {property.location}
          </p>
        )}

        {/* Meta facts */}
        <dl
          className="mt-8 grid grid-cols-3 gap-x-6 gap-y-1 border-y py-6"
          style={{ borderColor: PALETTE.hairline }}
        >
          {property.bedrooms != null && property.bedrooms > 0 && (
            <Fact label="Dormitorios" value={`${property.bedrooms}`} />
          )}
          {property.bathrooms != null && Number(property.bathrooms) > 0 && (
            <Fact label="Baños" value={`${property.bathrooms}`} />
          )}
          {property.metersSquared != null && (
            <Fact label="Área" value={`${property.metersSquared} m²`} />
          )}
        </dl>

        <div className="mt-8 flex items-baseline justify-between">
          <p
            className="font-mono tabular-nums"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(20px, 2.4vw, 28px)",
              fontWeight: 300,
            }}
          >
            {portalFormatCurrency(
              property.priceUSD ?? property.priceDOP,
              property.priceUSD ? "USD" : "DOP"
            )}
          </p>
          <Link
            href={`/p/${site.slug}/${property.id}`}
            className="group inline-flex items-center gap-2 border-b text-xs uppercase tracking-[0.25em] transition-opacity hover:opacity-70"
            style={{ borderColor: PALETTE.fg }}
          >
            Ver detalle
            <ArrowUpRight
              className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.25}
            />
          </Link>
        </div>
      </motion.div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt
        className="text-[9px] uppercase tracking-[0.25em]"
        style={{ color: PALETTE.fgMuted }}
      >
        {label}
      </dt>
      <dd
        className="mt-1 tabular-nums"
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: "22px",
          fontWeight: 300,
        }}
      >
        {value}
      </dd>
    </div>
  );
}

// ============================================================
// PROCESS — 3 lines numbered, magazine-style
// ============================================================

function Process({ brand }: { brand: string }) {
  const steps = [
    {
      n: "I",
      title: "Conversación",
      body: "Comprender lo que busca antes de mostrar nada. Sin guion, sin presión.",
    },
    {
      n: "II",
      title: "Curaduría",
      body: "Una lista corta de propiedades que coinciden con su criterio. Cero relleno.",
    },
    {
      n: "III",
      title: "Cierre",
      body: "Acompañamos hasta las llaves. Legal, financiero, mudanza. Todo en orden.",
    },
  ];

  return (
    <section
      id="process"
      className="border-t py-28 lg:py-36"
      style={{ borderColor: PALETTE.hairline }}
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-16 max-w-2xl">
          <p
            className="mb-3 text-[10px] uppercase tracking-[0.4em]"
            style={{ color: PALETTE.accent }}
          >
            <span className="mr-3 inline-block h-px w-10 align-middle" style={{ background: PALETTE.accent }} />
            Método
          </p>
          <h2
            className="text-balance"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 300,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            Tres tiempos.{" "}
            <em className="italic" style={{ color: PALETTE.accent }}>
              Sin atajos.
            </em>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
            >
              <p
                className="mb-5 font-mono text-xs tabular-nums uppercase tracking-[0.3em]"
                style={{ color: PALETTE.accent }}
              >
                {s.n}
              </p>
              <h3
                className="text-balance"
                style={{
                  fontFamily: "var(--font-cormorant), Georgia, serif",
                  fontSize: "clamp(24px, 3vw, 32px)",
                  fontWeight: 300,
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                }}
              >
                {s.title}
              </h3>
              <p
                className="mt-4 max-w-sm leading-[1.7]"
                style={{ color: PALETTE.fgMuted, fontSize: "15px" }}
              >
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// CONTACT — single column, generous
// ============================================================

function Contact({
  site,
  brand,
  wa,
}: {
  site: PortalData["site"];
  brand: string;
  wa: string | null;
}) {
  return (
    <section
      id="contact"
      className="border-t py-28 lg:py-40"
      style={{ borderColor: PALETTE.hairline }}
    >
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-12">
        <p
          className="mb-3 text-[10px] uppercase tracking-[0.4em]"
          style={{ color: PALETTE.accent }}
        >
          <span className="mr-3 inline-block h-px w-10 align-middle" style={{ background: PALETTE.accent }} />
          Conversemos
        </p>
        <h2
          className="text-balance"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(40px, 7vw, 96px)",
            fontWeight: 300,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
          }}
        >
          Una llamada.{" "}
          <em className="italic" style={{ color: PALETTE.accent }}>
            Sin compromiso.
          </em>
        </h2>

        <p
          className="mx-auto mt-8 max-w-md text-base leading-relaxed"
          style={{ color: PALETTE.fgMuted }}
        >
          Cuéntenos qué busca, qué quiere evitar y qué le hace pensar
          &ldquo;esta es la casa&rdquo;. Respondemos en menos de 24 horas.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener"
              className="group inline-flex min-h-[56px] items-center gap-2 border bg-[#0E0E0C] px-7 text-sm font-medium uppercase tracking-[0.2em] text-white transition-all hover:opacity-85"
              style={{ borderColor: PALETTE.bgInverse }}
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
              WhatsApp
            </a>
          )}
          {site.phone && (
            <a
              href={`tel:${site.phone}`}
              className="group inline-flex min-h-[56px] items-center gap-2 border px-7 text-sm font-medium uppercase tracking-[0.2em] transition-all hover:bg-[#0E0E0C] hover:text-white"
              style={{ borderColor: PALETTE.fg }}
            >
              <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
              {site.phone}
            </a>
          )}
        </div>

        {site.email && (
          <p className="mt-10 text-sm" style={{ color: PALETTE.fgMuted }}>
            o escríbenos a{" "}
            <a
              href={`mailto:${site.email}`}
              className="border-b transition-opacity hover:opacity-60"
              style={{ borderColor: PALETTE.fg, color: PALETTE.fg }}
            >
              {site.email}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}

// ============================================================
// FOOTER — minimal dark
// ============================================================

function Footer({ site, brand }: { site: PortalData["site"]; brand: string }) {
  return (
    <footer style={{ backgroundColor: PALETTE.bgInverse, color: "#F5F2EC" }}>
      <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12 lg:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 lg:gap-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <p
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 300,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              {brand}
            </p>
            <p
              className="mt-4 max-w-md text-sm leading-relaxed opacity-70"
            >
              {site.tagline ?? `Propiedades premium curadas con criterio editorial.`}
            </p>
          </div>

          <div>
            <p
              className="mb-4 text-[10px] uppercase tracking-[0.3em] opacity-50"
            >
              Contacto
            </p>
            <ul className="space-y-2 text-sm">
              {site.phone && (
                <li>
                  <a href={`tel:${site.phone}`} className="opacity-85 transition-opacity hover:opacity-100">
                    {site.phone}
                  </a>
                </li>
              )}
              {site.email && (
                <li>
                  <a href={`mailto:${site.email}`} className="opacity-85 transition-opacity hover:opacity-100">
                    {site.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div
          className="mt-16 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs opacity-55 sm:flex-row sm:items-center"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <p>© {new Date().getFullYear()} {brand}</p>
          <p>
            Powered by{" "}
            <Link href="/welcome" className="border-b border-current transition-opacity hover:opacity-80">
              estaila
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
