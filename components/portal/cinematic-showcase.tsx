"use client";

import {
  ArrowRight,
  ArrowUpRight,
  AtSign,
  Bath,
  Bed,
  Building2,
  Camera,
  Car,
  Check,
  ChevronRight,
  Clock,
  Cpu,
  Globe,
  Hash,
  Mail,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  Play,
  Send,
  Share2,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
} from "lucide-react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import Link from "next/link";
import { PropertyMap, type POIData } from "@/components/properties/map/property-map";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AMENITY_CATALOG,
  parseJSON,
  type AmenityKey,
} from "@/lib/portal-catalog";

// ============================================================
// Orrivo Residence — light editorial luxury template
// Inspired by orrivo.webflow.io. Beige cálido + black contrast.
// ============================================================

const PALETTE = {
  bg: "#F2EFE9", // beige cálido off-white
  bgDark: "#1A1A1A", // negro suave
  fg: "#2B2B2B", // gris oscuro para texto
  fgMuted: "#6B6B6B", // gris medio
  accent: "#B8956A", // dorado/bronce muted
  border: "#D9D4CA", // hairline
  card: "#ECE8DE", // card slightly darker than bg
};

// Re-export the same external API
export type LuxurySite = {
  slug: string;
  template: string;
  title: string | null;
  primaryColor: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  fontPair?: string;
  language?: string;
  enabledSections?: string;
  // Org branding overrides
  logoUrl?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  whiteLabel?: boolean;
};

export type LuxuryProperty = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  operation: string;
  status: string;
  priceUSD: number | null;
  priceDOP: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  metersSquared: number | null;
  location: string | null;
  address: string | null;
  mapsUrl: string | null;
  lat: number | null;
  lng: number | null;
  amenities: string;
  finishes: string;
  floorPlans: string;
  nearbyPois: string;
  videoUrl: string | null;
  walkthroughUrl: string | null;
  customTagline: string | null;
  premiumLanding: boolean;
  featuredPhoto?: string | null;
};

export type LuxuryAgent = { name: string };

// ============================================================
// MAIN
// ============================================================

export function CinematicShowcase({
  site,
  agent,
  property,
  photos,
  pois = [],
}: {
  site: LuxurySite;
  agent: LuxuryAgent;
  property: LuxuryProperty;
  photos: string[];
  pois?: POIData[];
}) {
  // Amenities accept legacy string[] OR {key,custom}[] formats
  const rawAmenities = parseJSON<unknown[]>(property.amenities ?? null, []);
  const amenities = rawAmenities
    .map((a) => {
      if (typeof a === "string") return { key: a as AmenityKey };
      if (a && typeof a === "object" && "key" in a)
        return a as { key: AmenityKey; custom?: string };
      return null;
    })
    .filter((a): a is { key: AmenityKey; custom?: string } => a !== null);

  const floorPlans = parseJSON<
    {
      type: string;
      beds: number;
      baths: number;
      m2: number;
      units: number;
    }[]
  >(property.floorPlans ?? null, []);

  const heroPhoto = property.featuredPhoto ?? photos[0] ?? null;
  const isCommercial =
    property.category === "LOCAL_COMERCIAL" ||
    property.category === "OFICINA" ||
    property.category === "INDUSTRIAL";
  const isLand =
    property.category === "SOLAR" || property.category === "TERRENO";
  const isResidential = !isCommercial && !isLand;

  const wa = site.whatsapp
    ? `https://wa.me/${site.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hola, me interesa la propiedad: ${property.title}`
      )}`
    : null;

  // Cinematic is a curated luxury aesthetic. We do NOT override the gold accent
  // with org primaryColor (would clash if user picks white/navy etc.).
  // Org identity surfaces through logo + name + voice only.

  return (
    <div
      className="orrivo min-h-screen antialiased"
      style={
        {
          backgroundColor: PALETTE.bg,
          color: PALETTE.fg,
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          ["--bg" as never]: PALETTE.bg,
          ["--bg-dark" as never]: PALETTE.bgDark,
          ["--fg" as never]: PALETTE.fg,
          ["--fg-muted" as never]: PALETTE.fgMuted,
          ["--accent" as never]: PALETTE.accent,
          ["--border" as never]: PALETTE.border,
          ["--card" as never]: PALETTE.card,
        } as React.CSSProperties
      }
    >
      <Nav site={site} agent={agent} />
      <Hero property={property} heroPhoto={heroPhoto} wa={wa} />

      {/* ----------------------------------------------------------------
          Premium gating — when property.premiumLanding === false (normal),
          we render only: Nav, Hero, Gallery, Contact, Footer.
          Premium-only sections add the editorial showcase experience.
          ---------------------------------------------------------------- */}
      {property.premiumLanding && <Marquee />}
      {property.premiumLanding &&
        (property.description || isResidential) && (
          <WhyChoose property={property} photos={photos} />
        )}
      {property.premiumLanding &&
        isResidential &&
        photos.length >= 2 && <RoomsSlider photos={photos} />}

      {/* Always: gallery (universal value) */}
      <GalleryOverview photos={photos} property={property} />

      {property.premiumLanding && <LocationMap property={property} pois={pois} />}
      {property.premiumLanding && floorPlans.length > 0 && (
        <FloorPlanning floorPlans={floorPlans} property={property} />
      )}
      {property.premiumLanding &&
        (property.walkthroughUrl || property.videoUrl) && (
          <VideoReveal
            videoUrl={property.videoUrl}
            walkthroughUrl={property.walkthroughUrl}
          />
        )}
      {property.premiumLanding && (
        <Amenities amenities={amenities} isCommercial={isCommercial} />
      )}

      {/* Always: contact form (conversion-critical) */}
      <Contact site={site} property={property} wa={wa} />

      {property.premiumLanding && <Stats />}
      {property.premiumLanding && <Reviews />}

      {/* Always: footer */}
      <Footer site={site} agent={agent} property={property} />
    </div>
  );
}

// ============================================================
// NAV — translucent beige with backdrop-blur, compact on scroll
// ============================================================

function Nav({ site, agent }: { site: LuxurySite; agent: LuxuryAgent }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-[var(--border)]/60 py-3"
          : "border-b border-transparent py-5"
      )}
      style={{
        backgroundColor: scrolled
          ? "rgba(242, 239, 233, 0.75)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
      }}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-6 lg:px-12">
        <Link
          href={`/p/${site.slug}`}
          className="inline-flex items-center gap-2.5"
          aria-label="Inicio"
        >
          {site.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={site.logoUrl}
              alt={site.title ?? agent.name}
              className="h-9 w-9 rounded-lg object-cover shadow-md ring-1 ring-white/10"
            />
          )}
          <span
            className={cn(
              "font-light tracking-tight transition-colors",
              scrolled ? "text-[var(--fg)]" : "text-white"
            )}
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: scrolled ? "22px" : "26px",
            }}
          >
            {site.title ?? agent.name}
          </span>
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-8 text-sm font-medium md:flex"
        >
          {[
            { href: "#why", label: "Home." },
            { href: "#rooms", label: "About." },
            { href: "#plans", label: "Plans." },
            { href: "#contact", label: "Contact." },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                "group relative transition-colors",
                scrolled ? "text-[var(--fg)]" : "text-white/85 hover:text-white"
              )}
            >
              {l.label}
              <span
                className="pointer-events-none absolute -bottom-1 left-0 h-px w-0 bg-current transition-all duration-300 group-hover:w-full"
                aria-hidden
              />
            </a>
          ))}
        </nav>

        <a
          href="#contact"
          className={cn(
            "group inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-sm font-medium transition-all",
            scrolled
              ? "bg-[var(--bg-dark)] text-white hover:bg-[var(--bg-dark)]/85"
              : "bg-white text-[var(--bg-dark)] hover:bg-white/90"
          )}
        >
          Schedule a visit
          <ArrowUpRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </a>
      </div>
    </header>
  );
}

// ============================================================
// HERO — full-bleed photo, giant italic title, glass stats card
// ============================================================

function Hero({
  property,
  heroPhoto,
  wa,
}: {
  property: LuxuryProperty;
  heroPhoto: string | null;
  wa: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 200]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, reduce ? 1.05 : 1]);

  const stats = [
    {
      icon: Maximize2,
      label: "Property size",
      value: property.metersSquared ? `${property.metersSquared} m²` : "—",
    },
    {
      icon: Bed,
      label: "Beds",
      value:
        property.bedrooms != null && property.bedrooms > 0
          ? `${property.bedrooms}+`
          : "—",
    },
    {
      icon: Bath,
      label: "Bathrooms",
      value:
        property.bathrooms != null && Number(property.bathrooms) > 0
          ? `${property.bathrooms}+`
          : "—",
    },
    {
      icon: Car,
      label: "Parking",
      value:
        property.parking != null && property.parking > 0
          ? `${property.parking}+`
          : "—",
    },
  ].filter((s) => s.value !== "—");

  // Build title word split for stagger animation
  const titleWords = property.title.split(/\s+/);

  return (
    <section
      ref={ref}
      className="relative h-[100svh] min-h-[720px] w-full overflow-hidden"
    >
      {/* Background photo with parallax + zoom-out */}
      <motion.div
        style={{ y, scale }}
        className="absolute inset-0"
        aria-hidden
      >
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroPhoto} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "linear-gradient(135deg, #3a3530 0%, #5a4f44 50%, #1a1a1a 100%)",
            }}
          />
        )}
      </motion.div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-black/45" />

      {/* Top address pill */}
      {(property.address || property.location) && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="absolute right-6 top-24 z-10 lg:right-12 lg:top-28"
        >
          <span className="text-xs text-white/85">
            {property.address ?? property.location}
          </span>
        </motion.div>
      )}

      {/* Title block — centered-left */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-center px-6 lg:px-12">
        <div className="max-w-5xl">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-5 text-[11px] font-medium uppercase tracking-[0.25em] text-white/85"
          >
            {property.operation === "EN_VENTA" ? "Now available" : "Available for rent"}
            {property.category && (
              <span className="mx-3 text-white/40">·</span>
            )}
            {property.category}
          </motion.p>

          <h1
            className="text-balance text-white"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(48px, 10vw, 140px)",
              fontWeight: 400,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            <span className="not-italic">{titleWords[0]}</span>{" "}
            {titleWords.slice(1).map((w, i) => (
              <motion.span
                key={`${w}-${i}`}
                initial={reduce ? false : { y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.9,
                  delay: 0.35 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="italic"
                style={{ display: "inline-block" }}
              >
                {w}{" "}
              </motion.span>
            ))}
          </h1>

          {/* CTAs */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <a
              href="#why"
              className="group inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[var(--bg-dark)] px-7 text-sm font-medium text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-[var(--bg-dark)]/85 active:scale-[0.98] motion-reduce:transform-none"
            >
              Discover more
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
            </a>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener"
                className="group inline-flex min-h-[52px] items-center gap-2 rounded-full border border-white/40 bg-white/5 px-7 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-white hover:bg-white hover:text-[var(--bg-dark)]"
              >
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                Call us now
              </a>
            )}
          </motion.div>
        </div>
      </div>

      {/* Floating stats card bottom */}
      {stats.length > 0 && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-6 bottom-8 z-10 lg:inset-x-12 lg:bottom-12"
        >
          <div
            className="mx-auto flex max-w-[1100px] flex-wrap items-stretch justify-around gap-y-3 rounded-2xl px-4 py-4 sm:px-8 sm:py-5"
            style={{
              backgroundColor: "rgba(242,239,233,0.85)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.4)",
              boxShadow: "0 20px 60px -20px rgba(0,0,0,0.4)",
            }}
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={cn(
                  "flex flex-1 min-w-[120px] flex-col items-start gap-2 px-3 sm:px-5",
                  i > 0 && "sm:border-l sm:border-[var(--border)]"
                )}
              >
                <div className="flex items-center gap-2">
                  <s.icon
                    className="h-3.5 w-3.5"
                    style={{ color: PALETTE.accent }}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </div>
                <p
                  className="font-light tabular-nums"
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "clamp(22px, 3vw, 32px)",
                  }}
                >
                  {s.value}
                </p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--fg-muted)]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}

// ============================================================
// MARQUEE — infinite scrolling italic serif
// ============================================================

function Marquee() {
  const items = [
    "Cutting-Edge Architecture",
    "Next-Gen Living",
    "Quality Living",
    "Innovative Structural Design",
  ];
  // Duplicate enough times for smooth loop
  const loop = [...items, ...items, ...items];

  return (
    <section
      className="relative overflow-hidden border-y py-10 lg:py-14"
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.bg }}
      aria-hidden
    >
      <div className="flex animate-[marquee_55s_linear_infinite] whitespace-nowrap motion-reduce:animate-none">
        {loop.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="mx-8 inline-flex items-center gap-12"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(48px, 7vw, 90px)",
              fontStyle: "italic",
              fontWeight: 300,
              color: PALETTE.fg,
            }}
          >
            {t}
            <Sparkles
              className="shrink-0"
              style={{ color: PALETTE.accent, width: 18, height: 18 }}
              strokeWidth={1.25}
            />
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </section>
  );
}

// ============================================================
// WHY CHOOSE — split image + 3 feature blocks
// ============================================================

function WhyChoose({
  property,
  photos,
}: {
  property: LuxuryProperty;
  photos: string[];
}) {
  const features = [
    {
      icon: Cpu,
      title: "Intelligent living solutions",
      body:
        "Climate, light and security orchestrated from a single app — built to evolve with you.",
    },
    {
      icon: Sun,
      title: "Modern living upgrades",
      body:
        "Open volumes, noble materials and uninterrupted natural light through floor-to-ceiling glazing.",
    },
    {
      icon: Sparkles,
      title: "Smart home innovations",
      body:
        "Pre-wired for the future: high-speed fiber, multi-room audio and discreet domotics throughout.",
    },
  ];

  return (
    <section
      id="why"
      className="relative mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-40"
    >
      <div className="mb-16 max-w-3xl">
        <Eyebrow text="Why choose this property?" />
        <h2
          className="mt-4 text-balance"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Discover the story behind this beautiful and{" "}
          <span className="italic" style={{ color: PALETTE.accent }}>
            singular
          </span>{" "}
          property.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        {/* Left: vertical image */}
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[var(--card)]">
            {photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[0]}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0" />
            )}
          </div>
        </Reveal>

        {/* Right: feature blocks */}
        <div className="flex flex-col justify-center">
          <ul className="divide-y" style={{ borderColor: PALETTE.border }}>
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.1}>
                <li className="flex items-start gap-5 py-7">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: PALETTE.card }}
                  >
                    <f.icon
                      className="h-5 w-5"
                      strokeWidth={1.5}
                      style={{ color: PALETTE.accent }}
                      aria-hidden
                    />
                  </div>
                  <div>
                    <h3
                      className="text-balance"
                      style={{
                        fontFamily: "var(--font-cormorant), Georgia, serif",
                        fontSize: "26px",
                        fontWeight: 400,
                        lineHeight: 1.2,
                      }}
                    >
                      {f.title}
                    </h3>
                    <p
                      className="mt-2 text-[15px] leading-[1.6]"
                      style={{ color: PALETTE.fgMuted }}
                    >
                      {f.body}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>

      {/* Panoramic image + paragraph */}
      {photos[1] && (
        <Reveal>
          <div className="mt-20">
            <div
              className="relative w-full overflow-hidden rounded-3xl bg-[var(--card)]"
              style={{ aspectRatio: "21 / 9" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[1]}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            {property.description && (
              <p
                className="mx-auto mt-10 max-w-[60ch] text-center text-[16px] leading-[1.7]"
                style={{ color: PALETTE.fgMuted }}
              >
                {property.description.length > 280
                  ? property.description.slice(0, 280).trim() + "…"
                  : property.description}
              </p>
            )}
          </div>
        </Reveal>
      )}
    </section>
  );
}

// ============================================================
// ROOMS SLIDER — horizontal scroll-snap cards
// ============================================================

function RoomsSlider({ photos }: { photos: string[] }) {
  const rooms = [
    { tag: "Living room", desc: "Volúmenes amplios, luz cenital, doble altura", size: "58 m²", style: "Modern", color: "Cream" },
    { tag: "Kitchen", desc: "Cocina abierta de chef con isla central en piedra", size: "22 m²", style: "Italian", color: "White" },
    { tag: "Bedroom", desc: "Suite principal con walk-in closet privado", size: "34 m²", style: "Japandi", color: "Beige" },
    { tag: "Swimming pool", desc: "Piscina infinity orientada al horizonte sur", size: "42 m²", style: "Resort", color: "Aqua" },
    { tag: "Rooftop", desc: "Terraza superior con pérgola motorizada", size: "70 m²", style: "Lounge", color: "Stone" },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector("article");
    const step = card ? card.clientWidth + 16 : el.clientWidth * 0.5;
    el.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  };

  return (
    <section id="rooms" className="relative py-28 lg:py-36">
      <div className="mx-auto mb-14 max-w-[1440px] px-6 lg:px-12">
        <Eyebrow text="Property" />
        <div className="mt-4 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <h2
            className="max-w-2xl text-balance"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Room overview with a{" "}
            <span className="italic" style={{ color: PALETTE.accent }}>
              singular
            </span>{" "}
            look.
          </h2>

          {/* Slider controls */}
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              aria-label="Anterior"
              className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-[var(--bg-dark)] hover:text-white"
              style={{ borderColor: PALETTE.fg }}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Siguiente"
              className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-[var(--bg-dark)] hover:text-white"
              style={{ borderColor: PALETTE.fg }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 lg:px-12 lg:gap-5"
        style={{ scrollPadding: "0 48px" }}
      >
        {rooms.map((r, i) => (
          <RoomCard
            key={r.tag}
            room={r}
            photo={photos[i % photos.length] ?? photos[0] ?? null}
            index={i}
          />
        ))}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}

function RoomCard({
  room,
  photo,
  index,
}: {
  room: { tag: string; desc: string; size: string; style: string; color: string };
  photo: string | null;
  index: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: index * 0.05 }}
      className="group shrink-0 snap-start"
      style={{ width: "min(86vw, 380px)" }}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[var(--card)]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : null}
      </div>
      <div className="mt-5">
        <p className="text-[11px] uppercase tracking-[0.15em]" style={{ color: PALETTE.accent }}>
          {room.tag}
        </p>
        <p
          className="mt-2 text-[15px] leading-[1.6]"
          style={{ color: PALETTE.fgMuted }}
        >
          {room.desc}
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs" style={{ color: PALETTE.fgMuted }}>
          <span className="inline-flex items-center gap-1.5">
            <Maximize2 className="h-3 w-3" strokeWidth={1.5} aria-hidden />
            {room.size}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" strokeWidth={1.5} aria-hidden />
            {room.style}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: PALETTE.accent }} />
            {room.color}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

// ============================================================
// GALLERY OVERVIEW — 3-image asymmetric grid
// ============================================================

function GalleryOverview({
  photos,
  property,
}: {
  photos: string[];
  property: LuxuryProperty;
}) {
  // Reuse photos cycling if not enough
  const list = [photos[0], photos[1], photos[2]]
    .map((p) => p ?? photos[0] ?? null)
    .filter(Boolean) as string[];

  return (
    <section className="relative mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-36">
      <div className="mb-14 max-w-3xl">
        <Eyebrow text="Property overview" />
        <h2
          className="mt-4 text-balance"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Take a detailed look at this{" "}
          <span className="italic" style={{ color: PALETTE.accent }}>
            stunning
          </span>{" "}
          property.
        </h2>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Reveal className="col-span-12 lg:col-span-7">
          <GalleryTile src={list[0]} aspect="aspect-[4/5] lg:aspect-[5/6]" property={property} />
        </Reveal>
        <div className="col-span-12 lg:col-span-5 grid gap-4">
          <Reveal delay={0.05}>
            <GalleryTile src={list[1]} aspect="aspect-[4/3]" property={property} />
          </Reveal>
          <Reveal delay={0.1}>
            <GalleryTile src={list[2]} aspect="aspect-[4/3]" property={property} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function GalleryTile({
  src,
  aspect,
  property,
}: {
  src: string | null;
  aspect: string;
  property: LuxuryProperty;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-[var(--card)]",
        aspect
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={property.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      ) : null}
    </div>
  );
}

// ============================================================
// LOCATION MAP — aerial-style card with floating pins
// ============================================================

function LocationMap({
  property,
  pois,
}: {
  property: LuxuryProperty;
  pois: POIData[];
}) {
  // Mapa real (Mapbox) cuando hay coordenadas + token; si no, fallback estilizado.
  const hasMap =
    property.lat != null &&
    property.lng != null &&
    !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (hasMap) {
    return (
      <section className="relative mx-auto max-w-[1440px] px-6 pb-28 lg:px-12 lg:pb-36">
        <Reveal>
          <div className="mb-6">
            <p
              className="text-[10px] uppercase tracking-[0.25em]"
              style={{ color: PALETTE.fgMuted }}
            >
              Location
            </p>
            <p
              className="mt-1"
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "clamp(22px, 3vw, 36px)",
                fontWeight: 400,
              }}
            >
              {property.location ?? property.address ?? "Premium location"}
            </p>
          </div>
          <PropertyMap
            property={{
              id: property.id,
              title: property.title,
              lat: property.lat,
              lng: property.lng,
              location: property.location,
            }}
            pois={pois}
            variant="full"
            className="!rounded-3xl"
          />
        </Reveal>
      </section>
    );
  }

  const nearby = parseJSON<{ key: string; distance: string }[]>(
    property.nearbyPois ?? null,
    []
  );

  const defaults = [
    { key: "Hospital", distance: "1.2 km" },
    { key: "5★ Hotel", distance: "1.3 km" },
    { key: "Park", distance: "1 km" },
    { key: "Restaurants", distance: "0.5 km" },
  ];
  const pins = nearby.length > 0
    ? nearby.slice(0, 4).map((p) => ({ key: p.key, distance: p.distance }))
    : defaults;

  const positions = [
    { left: "18%", top: "26%" },
    { left: "68%", top: "20%" },
    { left: "78%", top: "62%" },
    { left: "24%", top: "70%" },
  ];

  return (
    <section className="relative mx-auto max-w-[1440px] px-6 pb-28 lg:px-12 lg:pb-36">
      <Reveal>
        <div
          className="relative aspect-[16/8] w-full overflow-hidden rounded-3xl"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 40%, rgba(184,149,106,0.18) 0%, transparent 60%), linear-gradient(135deg, #DCD5C5 0%, #C9C0AC 100%)",
          }}
        >
          {/* Faint grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            aria-hidden
            style={{
              backgroundImage:
                "linear-gradient(rgba(43,43,43,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(43,43,43,0.4) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          {/* Central pin — property */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: PALETTE.accent }} />
              <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: PALETTE.accent }} />
            </span>
            <div
              className="absolute left-1/2 mt-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--bg-dark)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white shadow-lg"
            >
              {property.title.split(/\s+/).slice(0, 2).join(" ")}
            </div>
          </div>

          {pins.map((p, i) => {
            const pos = positions[i % positions.length];
            return (
              <div
                key={p.key}
                className="absolute"
                style={pos}
              >
                <div className="relative flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-md">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: PALETTE.accent }} />
                  <span className="text-xs font-medium text-[var(--fg)]">{p.key}</span>
                  <span className="text-[10px] font-mono tabular-nums" style={{ color: PALETTE.fgMuted }}>
                    {p.distance}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Location title overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: PALETTE.fgMuted }}>
                Location
              </p>
              <p
                className="mt-1"
                style={{
                  fontFamily: "var(--font-cormorant), Georgia, serif",
                  fontSize: "clamp(20px, 3vw, 28px)",
                  fontWeight: 400,
                }}
              >
                {property.location ?? property.address ?? "Premium location"}
              </p>
            </div>
            <MapPin className="h-5 w-5" strokeWidth={1.5} style={{ color: PALETTE.accent }} aria-hidden />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ============================================================
// FLOOR PLANNING — tabs
// ============================================================

function FloorPlanning({
  floorPlans,
  property,
}: {
  floorPlans: { type: string; beds: number; baths: number; m2: number; units: number }[];
  property: LuxuryProperty;
}) {
  const [active, setActive] = useState(0);
  const current = floorPlans[active];

  return (
    <section id="plans" className="relative mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-36">
      <div className="mb-12 max-w-3xl">
        <Eyebrow text="Floor planning" />
        <h2
          className="mt-4 text-balance"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Explore every level with our{" "}
          <span className="italic" style={{ color: PALETTE.accent }}>
            detailed
          </span>{" "}
          floor planning.
        </h2>
      </div>

      {/* Tab pills */}
      <div className="mb-10 flex flex-wrap items-center gap-2">
        {floorPlans.map((fp, i) => (
          <button
            key={fp.type}
            onClick={() => setActive(i)}
            className={cn(
              "group inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-sm transition-all",
              active === i
                ? "bg-[var(--bg-dark)] text-white"
                : "bg-transparent text-[var(--fg-muted)] hover:bg-[var(--card)] hover:text-[var(--fg)]"
            )}
          >
            {fp.type}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={active}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20"
      >
        {/* Technical floor plan SVG */}
        <div
          className="aspect-[4/3] overflow-hidden rounded-3xl p-8"
          style={{ backgroundColor: PALETTE.card }}
        >
          <svg
            viewBox="0 0 400 300"
            className="h-full w-full"
            fill="none"
            stroke={PALETTE.fg}
            strokeWidth="1.5"
            aria-hidden
          >
            {/* outer wall */}
            <rect x="40" y="40" width="320" height="220" />
            {/* internal walls */}
            <line x1="180" y1="40" x2="180" y2="160" />
            <line x1="40" y1="160" x2="180" y2="160" />
            <line x1="260" y1="160" x2="360" y2="160" />
            <line x1="260" y1="160" x2="260" y2="260" />
            {/* doors */}
            <line x1="115" y1="160" x2="135" y2="160" stroke={PALETTE.accent} strokeWidth="2.5" />
            <line x1="200" y1="160" x2="220" y2="160" stroke={PALETTE.accent} strokeWidth="2.5" />
            {/* labels */}
            <text x="100" y="100" fill={PALETTE.fgMuted} fontSize="9" fontFamily="monospace">
              LIVING
            </text>
            <text x="260" y="100" fill={PALETTE.fgMuted} fontSize="9" fontFamily="monospace">
              KITCHEN
            </text>
            <text x="100" y="220" fill={PALETTE.fgMuted} fontSize="9" fontFamily="monospace">
              BEDROOM
            </text>
            <text x="200" y="220" fill={PALETTE.fgMuted} fontSize="9" fontFamily="monospace">
              MASTER
            </text>
            <text x="300" y="220" fill={PALETTE.fgMuted} fontSize="9" fontFamily="monospace">
              BATH
            </text>
          </svg>
        </div>

        <div className="flex flex-col justify-center">
          <p
            className="text-[15px] leading-[1.7]"
            style={{ color: PALETTE.fgMuted }}
          >
            Configuración generosa con áreas sociales abiertas, zona privada
            separada y baño suite. Diseño pensado para el ritmo de la vida
            contemporánea.
          </p>

          <ul className="mt-7 space-y-3">
            <SpecRow label="Tipo" value={current.type} />
            <SpecRow label="Address" value={property.location ?? "Disponible bajo petición"} />
            <SpecRow label="Arquitectura" value="Ronald Dowson" />
            <SpecRow
              label="Incluye"
              value="Kitchen · Living · Balcony · Bedroom · Storage"
            />
            <SpecRow label="Área" value={`${current.m2} m²`} />
            <SpecRow label="Habitaciones" value={`${current.beds} · ${current.baths} baños`} />
            <SpecRow label="Unidades" value={String(current.units)} />
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#contact"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[var(--bg-dark)] px-6 text-sm font-medium text-white transition-all hover:scale-[1.02] hover:bg-[var(--bg-dark)]/85"
            >
              Book a visit
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </a>
            <a
              href="#contact"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border px-6 text-sm font-medium transition-all hover:bg-[var(--card)]"
              style={{ borderColor: PALETTE.fg }}
            >
              Call us now
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-start gap-3 border-b pb-3 text-sm" style={{ borderColor: PALETTE.border }}>
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: PALETTE.accent, marginTop: "0.55em" }}
      />
      <div className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">{label}</span>
        <span style={{ color: PALETTE.fgMuted }}>{value}</span>
      </div>
    </li>
  );
}

// ============================================================
// VIDEO REVEAL — expands with scroll progress (clip-path)
// ============================================================

function VideoReveal({
  videoUrl,
  walkthroughUrl,
}: {
  videoUrl: string | null;
  walkthroughUrl: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const insetRaw = useTransform(scrollYProgress, [0, 0.4], [10, 0]);
  const radiusRaw = useTransform(scrollYProgress, [0, 0.4], [24, 0]);
  const inset = useSpring(insetRaw, { stiffness: 60, damping: 25 });
  const radius = useSpring(radiusRaw, { stiffness: 60, damping: 25 });
  const marginInline = useTransform(inset, (v) => `${v}%`);
  const borderRadius = useTransform(radius, (v) => `${v}px`);

  return (
    <section ref={ref} className="relative bg-[var(--bg-dark)] py-20 lg:py-28">
      <motion.div
        style={{ marginInline, borderRadius, overflow: "hidden" }}
        className="relative aspect-[16/9] w-auto bg-black"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(40% 50% at 50% 50%, rgba(184,149,106,0.2), transparent 70%), linear-gradient(135deg, #2A2520 0%, #0A0908 100%)",
          }}
        />
        {/* Click-to-play overlay */}
        <a
          href={walkthroughUrl ?? videoUrl ?? "#"}
          target="_blank"
          rel="noopener"
          className="group absolute inset-0 flex items-center justify-center"
          aria-label="Reproducir video tour"
        >
          <div className="relative">
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: "rgba(255,255,255,0.15)",
                animation: reduce ? "none" : "pulse-ring 2.4s ease-out infinite",
              }}
            />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-[var(--bg-dark)] shadow-2xl transition-transform group-hover:scale-110">
              <Play className="ml-1 h-6 w-6" fill="currentColor" strokeWidth={0} />
            </div>
          </div>
        </a>

        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-3">
          <p
            className="text-white"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(20px, 3vw, 28px)",
            }}
          >
            Walkthrough &amp; video tour
          </p>
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/65">
            Click to expand
          </span>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.35);
          }
          100% {
            box-shadow: 0 0 0 50px rgba(255, 255, 255, 0);
          }
        }
      `}</style>
    </section>
  );
}

// ============================================================
// AMENITIES — short chip grid (Apple-style)
// ============================================================

function Amenities({
  amenities,
  isCommercial,
}: {
  amenities: { key: AmenityKey; custom?: string }[];
  isCommercial: boolean;
}) {
  const defaults: AmenityKey[] = isCommercial
    ? ["PARKING", "SECURITY", "COWORK", "ELEVATOR"]
    : ["POOL", "ROOFTOP", "GYM", "SECURITY", "PARKING", "SMART_HOME"];
  const list = amenities.length > 0 ? amenities.map((a) => a.key) : defaults;

  return (
    <section className="relative mx-auto max-w-[1440px] px-6 py-20 lg:px-12 lg:py-28">
      <div className="mb-12 max-w-3xl">
        <Eyebrow text="Amenities" />
        <h2
          className="mt-4 text-balance"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Everything you need,{" "}
          <span className="italic" style={{ color: PALETTE.accent }}>
            within reach
          </span>
          .
        </h2>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {list.slice(0, 8).map((key, i) => {
          const meta = AMENITY_CATALOG[key];
          const Icon = meta?.icon ?? Sparkles;
          return (
            <Reveal key={key} delay={i * 0.04}>
              <li
                className="flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:bg-[var(--card)]"
                style={{ borderColor: PALETTE.border }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: PALETTE.card }}
                >
                  <Icon
                    className="h-4 w-4"
                    strokeWidth={1.5}
                    style={{ color: PALETTE.accent }}
                    aria-hidden
                  />
                </div>
                <span className="text-sm font-medium">{meta?.label ?? key}</span>
              </li>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}

// ============================================================
// CONTACT — info + form
// ============================================================

function Contact({
  site,
  property,
  wa,
}: {
  site: LuxurySite;
  property: LuxuryProperty;
  wa: string | null;
}) {
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Solicitud recibida", {
        description: "Le contactaremos en menos de 24 horas.",
      });
      (e.target as HTMLFormElement).reset();
      setSubmitting(false);
    }, 800);
  }

  return (
    <section
      id="contact"
      className="relative mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-36"
    >
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
        {/* Left — info */}
        <div>
          <Eyebrow text="Get in touch" />
          <h2
            className="mt-4 text-balance"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Any{" "}
            <span className="italic" style={{ color: PALETTE.accent }}>
              inquiry?
            </span>
          </h2>

          <p
            className="mt-8 text-[11px] uppercase tracking-[0.25em]"
            style={{ color: PALETTE.accent }}
          >
            Catch us here
          </p>
          <div
            className="mt-1 h-px w-full max-w-xs"
            style={{ background: PALETTE.border }}
          />

          <ul className="mt-6 space-y-5">
            {site.email && (
              <ContactItem
                icon={Mail}
                primary={site.email}
                href={`mailto:${site.email}`}
              />
            )}
            {site.phone && (
              <ContactItem
                icon={Phone}
                primary={site.phone}
                href={`tel:${site.phone}`}
              />
            )}
            {wa && (
              <ContactItem
                icon={MessageCircle}
                primary="WhatsApp directo"
                href={wa}
                external
              />
            )}
            {property.address && (
              <ContactItem icon={MapPin} primary={property.address} />
            )}
            <ContactItem
              icon={Clock}
              primary="Lunes – Sábado · 9am – 7pm"
            />
          </ul>
        </div>

        {/* Right — form */}
        <form
          onSubmit={onSubmit}
          className="rounded-3xl p-8 sm:p-10"
          style={{ backgroundColor: PALETTE.card }}
        >
          <p className="mb-7 text-[11px] uppercase tracking-[0.25em]" style={{ color: PALETTE.accent }}>
            Send a message
          </p>
          <div className="space-y-6">
            <FloatingInput label="Name" name="name" required icon="user" />
            <FloatingInput label="Email" name="email" type="email" required icon="mail" />
            <FloatingInput label="Subject" name="subject" icon="pencil" />
            <FloatingInput label="Budget (USD)" name="budget" icon="dollar" />
            <FloatingInput label="Message" name="message" textarea />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="group mt-8 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[var(--bg-dark)] text-base font-semibold text-white transition-all hover:scale-[1.02] hover:bg-[var(--bg-dark)]/85 active:scale-[0.98] disabled:opacity-60 motion-reduce:transform-none"
          >
            {submitting ? "Sending…" : "Send message"}
            <Send className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
          </button>
        </form>
      </div>
    </section>
  );
}

function ContactItem({
  icon: Icon,
  primary,
  href,
  external,
}: {
  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
    style?: React.CSSProperties;
    "aria-hidden"?: boolean;
  }>;
  primary: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: PALETTE.accent }} aria-hidden />
      <span className="text-[15px]">{primary}</span>
    </>
  );
  if (href)
    return (
      <li>
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener" : undefined}
          className="inline-flex items-center gap-3 transition-colors hover:text-[var(--accent)]"
        >
          {inner}
        </a>
      </li>
    );
  return (
    <li className="inline-flex items-center gap-3">{inner}</li>
  );
}

function FloatingInput({
  label,
  name,
  type = "text",
  required,
  textarea,
  icon,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  icon?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const float = focused || value !== "";

  return (
    <label className="relative block">
      <span
        className={cn(
          "pointer-events-none absolute left-0 origin-left transition-all duration-300",
          float ? "top-0 text-[10px] tracking-[0.2em]" : "top-3.5 text-sm"
        )}
        style={{
          color: float ? PALETTE.accent : PALETTE.fgMuted,
          textTransform: float ? "uppercase" : "none",
        }}
      >
        {label}
        {required && <span className="ml-0.5">*</span>}
      </span>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          rows={3}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => setValue(e.target.value)}
          className="block w-full resize-none border-0 border-b bg-transparent pb-2 pt-7 text-sm focus:outline-none focus:ring-0"
          style={{ borderColor: focused ? PALETTE.accent : PALETTE.border, color: PALETTE.fg }}
        />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => setValue(e.target.value)}
          className="block w-full border-0 border-b bg-transparent pb-2 pt-7 text-sm focus:outline-none focus:ring-0"
          style={{ borderColor: focused ? PALETTE.accent : PALETTE.border, color: PALETTE.fg }}
        />
      )}
      {/* Animated underline */}
      <span
        className="pointer-events-none absolute bottom-0 left-0 h-px transition-all duration-400 ease-out"
        style={{
          background: PALETTE.accent,
          width: focused ? "100%" : "0%",
        }}
        aria-hidden
      />
    </label>
  );
}

// ============================================================
// STATS — counter-up
// ============================================================

function Stats() {
  const stats = [
    { value: 1000, suffix: "+", label: "Properties delivered" },
    { value: 2300, suffix: "+", label: "Clients served" },
    { value: 5, suffix: "+", label: "Awards" },
    { value: 12, suffix: "+", label: "Daily inquiries" },
    { value: 4.9, suffix: "", label: "Rating", decimal: true },
  ];

  return (
    <section className="relative border-y" style={{ borderColor: PALETTE.border }}>
      <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-12 lg:py-24">
        <Eyebrow text="Some fun facts" />
        <div className="mt-10 grid grid-cols-2 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <Counter key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({
  value,
  suffix,
  label,
  decimal,
}: {
  value: number;
  suffix: string;
  label: string;
  decimal?: boolean;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: 2000 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, motionValue, value]);

  useEffect(() => {
    return spring.on("change", (v) => {
      setDisplay(
        decimal ? v.toFixed(1) : Math.round(v >= 1000 ? v / 1000 : v).toString() + (v >= 1000 ? "k" : "")
      );
    });
  }, [spring, decimal]);

  return (
    <div>
      <p
        ref={ref}
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: "clamp(48px, 6vw, 96px)",
          fontWeight: 400,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        <span>{display}</span>
        <span>{suffix}</span>
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: PALETTE.fgMuted }}>
        {label}
      </p>
    </div>
  );
}

// ============================================================
// REVIEWS — mixed editorial layout
// ============================================================

function Reviews() {
  return (
    <section className="relative mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-36">
      <div className="max-w-3xl">
        <Eyebrow text="Property review" />
        <h2
          className="mt-4 text-balance"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          A space designed for{" "}
          <span className="italic" style={{ color: PALETTE.accent }}>
            comfort
          </span>
          .
        </h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Rating card */}
        <Reveal>
          <div
            className="flex h-full flex-col justify-between rounded-3xl p-7"
            style={{ backgroundColor: PALETTE.card }}
          >
            <div className="flex items-center -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full ring-2"
                  style={{
                    background: `linear-gradient(135deg, hsl(${30 + i * 25}, 30%, ${65 - i * 5}%), hsl(${20 + i * 30}, 25%, ${50 - i * 4}%))`,
                    borderColor: PALETTE.card,
                  }}
                />
              ))}
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold"
                style={{ background: PALETTE.bgDark, color: "white" }}
              >
                +98
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="h-4 w-4"
                  fill={PALETTE.accent}
                  stroke={PALETTE.accent}
                  strokeWidth={1}
                />
              ))}
            </div>
            <p
              className="mt-3"
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "44px",
                fontWeight: 400,
                lineHeight: 1,
              }}
            >
              4.9 <span style={{ color: PALETTE.fgMuted }}>/ 5.0</span>
            </p>
            <p className="mt-2 text-xs" style={{ color: PALETTE.fgMuted }}>
              Based on 100+ verified reviews
            </p>
          </div>
        </Reveal>

        {/* Big number card on dark */}
        <Reveal delay={0.05}>
          <div
            className="flex h-full flex-col justify-between rounded-3xl p-7 text-white"
            style={{ backgroundColor: PALETTE.bgDark }}
          >
            <TrendingUp className="h-5 w-5" style={{ color: PALETTE.accent }} strokeWidth={1.5} />
            <p
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "clamp(60px, 8vw, 110px)",
                fontWeight: 400,
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
              }}
            >
              98.8<span style={{ color: PALETTE.accent, fontSize: "0.5em" }}>%</span>
            </p>
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
              Cliente satisfecho
            </p>
          </div>
        </Reveal>

        {/* Testimonial */}
        <Reveal delay={0.1}>
          <div
            className="flex h-full flex-col rounded-3xl p-7"
            style={{ backgroundColor: PALETTE.card }}
          >
            <span
              className="leading-none"
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "80px",
                color: PALETTE.accent,
                fontStyle: "italic",
              }}
            >
              &ldquo;
            </span>
            <blockquote
              className="-mt-3 flex-1"
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "20px",
                fontWeight: 400,
                lineHeight: 1.4,
              }}
            >
              Volumes that breathe, materials that age well, and an architect&apos;s eye for light. We closed in 12 days.
            </blockquote>
            <p className="mt-5 text-xs">
              <span className="font-medium">Devid Jones</span>
              <span className="ml-2" style={{ color: PALETTE.fgMuted }}>House Owner</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER — dark
// ============================================================

function Footer({
  site,
  agent,
  property,
}: {
  site: LuxurySite;
  agent: LuxuryAgent;
  property: LuxuryProperty;
}) {
  return (
    <footer
      className="text-[var(--bg)]"
      style={{ backgroundColor: PALETTE.bgDark }}
    >
      <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-12 lg:py-28">
        <p
          className="max-w-4xl text-balance"
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(36px, 5.5vw, 80px)",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Let&apos;s help you find the{" "}
          <span className="italic" style={{ color: PALETTE.accent }}>
            perfect
          </span>{" "}
          property — or get top value for the one you own.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 lg:gap-16">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em]" style={{ color: PALETTE.accent }}>
              Contact
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              {site.phone && (
                <li>
                  <a href={`tel:${site.phone}`} className="hover:opacity-80">
                    {site.phone}
                  </a>
                </li>
              )}
              {site.email && (
                <li>
                  <a href={`mailto:${site.email}`} className="hover:opacity-80">
                    {site.email}
                  </a>
                </li>
              )}
              {property.address && (
                <li className="opacity-80">{property.address}</li>
              )}
            </ul>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.25em]" style={{ color: PALETTE.accent }}>
              Follow us
            </p>
            <div className="mt-5 flex gap-2">
              {[Hash, MessageCircle, Camera, Share2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-white hover:bg-white hover:text-[var(--bg-dark)]"
                  aria-label="Social"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.25em]" style={{ color: PALETTE.accent }}>
              Listing
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                <Building2 className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{property.title}</p>
                <p className="text-xs opacity-65">
                  {property.priceUSD
                    ? `$${Number(property.priceUSD).toLocaleString()}`
                    : "Consulte precio"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-16 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs md:flex-row md:items-center"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <p className="opacity-60">
            © {new Date().getFullYear()} {site.title ?? agent.name}. All rights reserved.
          </p>
          <div className="flex gap-5 opacity-60">
            <a href="#" className="hover:opacity-100">Privacy</a>
            <a href="#" className="hover:opacity-100">Terms</a>
            <a href="#" className="hover:opacity-100">Licenses</a>
            <a href="#" className="hover:opacity-100">Changelog</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// Helpers
// ============================================================

function Eyebrow({ text }: { text: string }) {
  return (
    <p
      className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.25em]"
      style={{ color: PALETTE.accent }}
    >
      <span className="h-px w-8" style={{ background: PALETTE.accent }} />
      {text}
    </p>
  );
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
