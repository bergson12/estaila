"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Bath,
  Bed,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  Globe,
  Hash,
  KanbanSquare,
  Languages,
  Lock,
  Mail,
  Megaphone,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LanguageProvider,
  useLang,
} from "./language-context";
import type { Lang } from "@/lib/marketing-i18n";

// ============================================================
// VirtualStaging-inspired one-page marketing landing.
// One measurable promise: "De foto vacía a propiedad vendiéndose en 60 segundos".
// Repeated in hero, guarantee, testimonials, CTA.
// ============================================================

// CRM-aligned marketing landing — design language shared with the panel
import { CrmLanding } from "./crm-landing";

export function MarketingPage() {
  return (
    <LanguageProvider>
      <CrmLanding />
    </LanguageProvider>
  );
}

// Legacy SaaS landing retained as fallback (Shell function below)

function Shell() {
  return (
    <div className="dark min-h-screen bg-[#0a0a0c] text-white antialiased selection:bg-violet-500/30">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black focus:shadow-2xl"
      >
        Saltar al contenido
      </a>
      <BgGrid />
      <PromiseBar />
      <Nav />
      <main id="main" className="pt-10">
        <Hero />
        <BeforeAfter />
        <LogosTrust />
        <TripleGuarantee />
        <HowItWorks />
        <ModulesVariety />
        <PromiseTransparency />
        <Testimonials />
        <ComprehensiveServices />
        <CaseStudy />
        <Differentiator />
        <Pricing />
        <FinalCTAStats />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]";

// ============================================================
// BG GRID
// ============================================================

function BgGrid() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="absolute -left-32 top-0 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="absolute -right-32 top-[500px] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="absolute left-1/2 top-[1200px] h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-fuchsia-500/8 blur-[140px]" />
    </div>
  );
}

// ============================================================
// PROMISE BAR — sticky top (VirtualStaging signature)
// ============================================================

function PromiseBar() {
  const { lang } = useLang();
  const copy =
    lang === "es"
      ? "Studio IA: foto vacía → staging fotorrealista en menos de 60 segundos."
      : "Studio AI: empty photo → photorealistic staging in under 60 seconds.";
  return (
    <div className="fixed inset-x-0 top-0 z-[60] border-b border-violet-500/30 bg-gradient-to-r from-violet-600/95 via-fuchsia-600/95 to-violet-600/95 px-4 py-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 text-center text-xs font-medium text-white sm:text-sm">
        <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{copy}</span>
        <a
          href="#guarantee"
          className="hidden shrink-0 items-center gap-1 underline-offset-2 hover:underline sm:inline-flex"
        >
          {lang === "es" ? "Cómo funciona" : "Learn more"}
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </a>
      </div>
    </div>
  );
}

// ============================================================
// NAV
// ============================================================

function Nav() {
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 30);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-10 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/5 bg-[#0a0a0c]/80 py-2 backdrop-blur-xl"
          : "border-b border-transparent py-4"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link
          href="/welcome"
          aria-label="estaila — Inicio"
          className={cn("inline-flex items-center gap-2.5 rounded-md p-1 -m-1", FOCUS_RING)}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
            <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2.25} aria-hidden />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">estaila</span>
        </Link>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-1 text-sm font-medium md:flex"
        >
          {[
            { href: "#how", label: t.nav.features },
            { href: "#modules", label: t.nav.studio },
            { href: "#templates", label: t.nav.templates },
            { href: "#pricing", label: t.nav.pricing },
            { href: "#faq", label: "FAQ" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex min-h-[40px] items-center rounded-md px-3 text-white/70 transition-colors hover:bg-white/5 hover:text-white",
                FOCUS_RING
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangSwitcher />
          <Link
            href="/login"
            className={cn(
              "hidden min-h-[40px] items-center rounded-md px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white sm:inline-flex",
              FOCUS_RING
            )}
          >
            {t.nav.login}
          </Link>
          <Link
            href="/signup"
            className={cn(
              "group inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-white px-4 text-sm font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98]",
              FOCUS_RING
            )}
          >
            {t.hero.ctaPrimary}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={lang === "es" ? "Cambiar idioma" : "Change language"}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 text-xs font-medium uppercase tracking-wider transition-colors hover:bg-white/10",
          FOCUS_RING
        )}
      >
        <Languages className="h-3.5 w-3.5" aria-hidden />
        {lang}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            aria-label="Idiomas"
            className="absolute right-0 z-50 mt-1.5 w-36 overflow-hidden rounded-md border border-white/10 bg-[#15151a] shadow-xl"
          >
            {(["es", "en"] as Lang[]).map((l) => (
              <li key={l}>
                <button
                  role="option"
                  aria-selected={lang === l}
                  onClick={() => {
                    setLang(l);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full min-h-[40px] items-center justify-between px-3 text-sm transition-colors hover:bg-white/5",
                    lang === l ? "text-violet-400" : "text-white/80",
                    FOCUS_RING
                  )}
                >
                  <span>{l === "es" ? "Español" : "English"}</span>
                  {lang === l && <Check className="h-3.5 w-3.5" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ============================================================
// HERO — one measurable promise repeated everywhere
// ============================================================

function Hero() {
  const { lang } = useLang();
  const reduce = useReducedMotion();

  const copy =
    lang === "es"
      ? {
          h1a: "CRM + Studio IA que",
          h1b: "vende casas más rápido.",
          sub: "Sube una foto vacía y recibe un staging fotorrealista en menos de 60 segundos. estaila ayuda a los agentes inmobiliarios a generar más visitas, más leads y más cierres.",
          cta: "Empezar gratis",
          micro: "Setup en 5 min · 5 créditos gratis sin tarjeta · cancela cuando quieras",
          badges: [
            { label: "4.9 / 5", sub: "Capterra" },
            { label: "60 seg", sub: "Por imagen IA" },
            { label: "30 días", sub: "Garantía total" },
            { label: "$0", sub: "Para empezar" },
          ],
        }
      : {
          h1a: "CRM + AI Studio that",
          h1b: "sells homes faster.",
          sub: "Upload an empty photo and get back a photorealistic staged image in under 60 seconds. estaila helps real estate agents get more views, more leads, and more closings.",
          cta: "Start free",
          micro: "5-min setup · 5 free credits, no card required · cancel anytime",
          badges: [
            { label: "4.9 / 5", sub: "Capterra" },
            { label: "60 sec", sub: "Per AI image" },
            { label: "30 days", sub: "Full guarantee" },
            { label: "$0", sub: "To start" },
          ],
        };

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-28 sm:pt-32 lg:px-10 lg:pb-28 lg:pt-36">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        {/* Copy */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {lang === "es"
              ? "+2,500 agentes ya cierran más rápido"
              : "+2,500 agents already closing faster"}
          </div>

          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {copy.h1a}
            <br />
            <span className="bg-gradient-to-br from-violet-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
              {copy.h1b}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg">
            {copy.sub}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className={cn(
                "group inline-flex min-h-[52px] items-center gap-2 rounded-lg bg-white px-6 text-base font-semibold text-black shadow-2xl shadow-white/10 transition-all hover:scale-[1.02] hover:bg-white/90 active:scale-[0.98] motion-reduce:transform-none",
                FOCUS_RING
              )}
            >
              {copy.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
            </Link>
            <a
              href="#before-after"
              className={cn(
                "group inline-flex min-h-[52px] items-center gap-2 rounded-lg border border-white/15 px-6 text-sm font-medium text-white/90 transition-all hover:border-white/40 hover:bg-white/5 hover:text-white",
                FOCUS_RING
              )}
            >
              {lang === "es" ? "Ver demo en vivo" : "Watch live demo"}
              <ArrowUpRight className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </a>
          </div>

          <p className="mt-4 text-xs text-white/55">{copy.micro}</p>

          {/* Trust badges */}
          <dl className="mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {copy.badges.map((b) => (
              <div key={b.label}>
                <dt className="sr-only">{b.sub}</dt>
                <dd className="font-mono text-xl font-bold tabular-nums">{b.label}</dd>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/55">
                  {b.sub}
                </p>
              </div>
            ))}
          </dl>
        </motion.div>

        {/* Right: floating mockup */}
        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-[440px] sm:h-[500px] lg:h-[560px]"
      aria-hidden
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-500/20 blur-2xl" />

      {/* Main dashboard card */}
      <motion.div
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-0 top-0 w-[78%] overflow-hidden rounded-2xl border border-white/10 bg-[#15151a]/95 shadow-2xl backdrop-blur-xl"
      >
        <MockBrowser title="estaila · Studio IA">
          <div className="space-y-3 p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="aspect-video rounded-md bg-gradient-to-br from-slate-700 to-slate-800">
                <p className="p-1.5 text-[9px] text-white/55">Antes · vacío</p>
              </div>
              <div className="aspect-video rounded-md bg-gradient-to-br from-amber-400 via-fuchsia-400 to-violet-500">
                <p className="p-1.5 text-[9px] font-semibold text-white">
                  Después · 47s
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Listo en 47 segundos
                </span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                  2 créditos
                </span>
              </div>
            </div>
            {/* Mini chart */}
            <div className="rounded-lg border border-white/5 bg-white/5 p-2.5">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-white/55">
                Revenue 14d
              </p>
              <div className="flex h-10 items-end gap-0.5">
                {[40, 55, 35, 70, 50, 80, 65, 90, 60, 75, 95, 85, 70, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-gradient-to-t from-violet-500 to-fuchsia-400"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </MockBrowser>
      </motion.div>

      {/* Toast */}
      <motion.div
        initial={reduce ? false : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="absolute -right-2 bottom-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 backdrop-blur-xl"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div>
          <p className="text-[11px] font-semibold">Nuevo lead</p>
          <p className="text-[10px] text-white/65">María quiere agendar visita</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MockBrowser({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-white/5 bg-black/40 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <span className="ml-2 truncate text-[10px] text-white/45">{title}</span>
      </div>
      {children}
    </>
  );
}

// ============================================================
// BEFORE / AFTER — show the product, don't describe it
// ============================================================

function BeforeAfter() {
  const { lang } = useLang();
  const reduce = useReducedMotion();
  const items = [
    {
      label: lang === "es" ? "Sala · staging Moderno" : "Living · Modern staging",
      time: "47s",
      before: "bg-slate-700",
      after: "from-amber-200 via-violet-300 to-cyan-300",
    },
    {
      label: lang === "es" ? "Cocina · staging Italiano" : "Kitchen · Italian staging",
      time: "52s",
      before: "bg-stone-700",
      after: "from-rose-200 via-amber-200 to-emerald-200",
    },
    {
      label: lang === "es" ? "Exterior · twilight" : "Exterior · twilight",
      time: "38s",
      before: "bg-zinc-700",
      after: "from-orange-300 via-rose-400 to-violet-500",
    },
  ];

  return (
    <section id="before-after" className="relative z-10 mx-auto max-w-7xl px-6 pb-24 lg:px-10">
      <div className="mb-12 text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55">
          <span className="h-px w-6 bg-white/20" />
          {lang === "es" ? "Listings reales" : "Real listings"}
          <span className="h-px w-6 bg-white/20" />
        </p>
        <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {lang === "es" ? "Antes y después" : "Before and after"}{" "}
          <span className="bg-gradient-to-br from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {lang === "es" ? "en segundos" : "in seconds"}
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-white/65">
          {lang === "es"
            ? "Tres ejemplos de propiedades vacías transformadas con Studio IA. Sin contratar fotógrafo, sin Photoshop, sin esperar 3 días."
            : "Three vacant property examples transformed with AI Studio. No photographer, no Photoshop, no 3-day wait."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/20"
          >
            <div className="grid grid-cols-2 gap-1.5">
              <div className={cn("relative aspect-video rounded-md", it.before)}>
                <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {lang === "es" ? "Antes" : "Before"}
                </span>
              </div>
              <div className={cn("relative aspect-video rounded-md bg-gradient-to-br", it.after)}>
                <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {lang === "es" ? "Después" : "After"}
                </span>
                <span className="absolute right-2 bottom-2 rounded bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {it.time}
                </span>
              </div>
            </div>
            <p className="mt-3 px-1 text-sm font-medium">{it.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// LOGOS TRUST BAR
// ============================================================

function LogosTrust() {
  const { lang } = useLang();
  return (
    <section className="relative z-10 border-y border-white/5 bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <p className="mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-white/55">
          {lang === "es"
            ? "+2,500 agentes inmobiliarios en 30+ países ya cierran más rápido con estaila"
            : "+2,500 real estate agents across 30+ countries already closing faster with estaila"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-55">
          {[
            "Coastal Realty",
            "Casa Linda",
            "Modern Estates",
            "Global Brokers",
            "Urban Homes",
            "Marbella Estates",
          ].map((name) => (
            <span
              key={name}
              className="text-sm font-semibold tracking-tight text-white/75"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TRIPLE GUARANTEE (VirtualStaging signature)
// ============================================================

function TripleGuarantee() {
  const { lang } = useLang();
  const [active, setActive] = useState(0);
  const guarantees =
    lang === "es"
      ? [
          {
            icon: Zap,
            title: "Setup en 5 minutos",
            sub: "Onboarding express",
            body: "Importa tus propiedades, configura tu portal y genera tu primera imagen IA en menos de 5 minutos. Si necesitas más, te ayudamos en una videollamada gratuita.",
          },
          {
            icon: ShieldCheck,
            title: "30 días o devolución",
            sub: "Money-back garantizado",
            body: "Si en 30 días no recibes valor real — primer lead, primera imagen generada, primer portal publicado — te devolvemos el 100%. Sin preguntas. Es una promesa.",
          },
          {
            icon: MessageCircle,
            title: "Soporte humano ilimitado",
            sub: "No bots, no tickets",
            body: "Chat directo en español con personas reales. Tiempo de respuesta promedio < 1 hora en horario hábil. WhatsApp, email, videollamada. Tú eliges.",
          },
        ]
      : [
          {
            icon: Zap,
            title: "5-minute setup",
            sub: "Express onboarding",
            body: "Import your properties, set up your portal and generate your first AI image in under 5 minutes. Need more? We help you on a free video call.",
          },
          {
            icon: ShieldCheck,
            title: "30 days or refund",
            sub: "Money-back guaranteed",
            body: "If in 30 days you don't see real value — first lead, first generated image, first portal published — we refund 100%. No questions. That's a promise.",
          },
          {
            icon: MessageCircle,
            title: "Unlimited human support",
            sub: "No bots, no tickets",
            body: "Direct chat in English/Spanish with real people. Average response time < 1h on business hours. WhatsApp, email, video call. Your choice.",
          },
        ];

  return (
    <section id="guarantee" className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <div className="mb-12 text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-violet-400">
          <span className="h-px w-6 bg-violet-400" />
          {lang === "es" ? "Por qué elegirnos" : "Why choose us"}
          <span className="h-px w-6 bg-violet-400" />
        </p>
        <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {lang === "es" ? "Un equipo en el que" : "A team you can"}{" "}
          <span className="bg-gradient-to-br from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {lang === "es" ? "puedes confiar" : "trust"}
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[280px_1fr]">
        {/* Tabs */}
        <div className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
          {guarantees.map((g, i) => (
            <button
              key={g.title}
              onClick={() => setActive(i)}
              className={cn(
                "group flex min-w-[200px] items-center gap-3 rounded-xl border p-4 text-left transition-all lg:min-w-0",
                active === i
                  ? "border-violet-500/40 bg-violet-500/[0.08]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                  active === i
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                    : "bg-white/5 text-white/70"
                )}
              >
                <g.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{g.title}</p>
                <p className="text-xs text-white/55">{g.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.06] via-white/[0.02] to-cyan-500/[0.06] p-8 lg:p-12">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="text-3xl font-bold tracking-tight">{guarantees[active].title}</h3>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75">
              {guarantees[active].body}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// HOW IT WORKS — 3 steps
// ============================================================

function HowItWorks() {
  const { lang } = useLang();
  const steps =
    lang === "es"
      ? [
          {
            n: "01",
            icon: Upload,
            title: "Crea tu cuenta gratis",
            body: "Sin tarjeta de crédito. 5 créditos IA incluidos para que pruebes Studio sin compromiso. Setup completo en 60 segundos.",
          },
          {
            n: "02",
            icon: Wand2,
            title: "Sube tu primera propiedad",
            body: "Arrastra fotos, completa los datos básicos (título, precio, ubicación). El sistema detecta automáticamente habitaciones, estilo y oportunidades.",
          },
          {
            n: "03",
            icon: TrendingUp,
            title: "Genera + publica en 1 click",
            body: "Staging IA en 60s, portal premium con tu marca, CRM activo con pipeline. Tu primera propiedad lista para enseñar al mundo.",
          },
        ]
      : [
          {
            n: "01",
            icon: Upload,
            title: "Create your free account",
            body: "No credit card. 5 AI credits included to try Studio risk-free. Complete setup in 60 seconds.",
          },
          {
            n: "02",
            icon: Wand2,
            title: "Upload your first property",
            body: "Drag photos, fill in basics (title, price, location). The system auto-detects rooms, style and improvement opportunities.",
          },
          {
            n: "03",
            icon: TrendingUp,
            title: "Generate + publish in 1 click",
            body: "AI staging in 60s, premium portal with your brand, CRM active with pipeline. Your first property ready to show the world.",
          },
        ];

  return (
    <section id="how" className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <div className="mb-14 text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55">
          <span className="h-px w-6 bg-white/20" />
          {lang === "es" ? "Cómo funciona" : "How it works"}
          <span className="h-px w-6 bg-white/20" />
        </p>
        <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {lang === "es" ? "De cero a publicado" : "From zero to published"}{" "}
          <span className="bg-gradient-to-br from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {lang === "es" ? "en 5 minutos" : "in 5 minutes"}
          </span>
        </h2>
      </div>

      <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Connecting line — desktop only */}
        <div className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent md:block" />

        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="relative"
          >
            <div className="relative z-10 mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-[#0a0a0c] ring-1 ring-violet-500/30">
              <s.icon className="h-9 w-9 text-violet-400" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-violet-400">
              {s.n}
            </p>
            <h3 className="text-xl font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// MODULES VARIETY (tabs like VirtualStaging's furniture styles)
// ============================================================

function ModulesVariety() {
  const { lang } = useLang();
  const [active, setActive] = useState(0);
  const modules =
    lang === "es"
      ? [
          { key: "crm", label: "CRM", icon: KanbanSquare, desc: "Pipeline kanban con 6 etapas. Drag & drop. Notas, próximas acciones, recordatorios automáticos.", chips: ["Contactos", "Propiedades", "Pipeline"] },
          { key: "studio", label: "Studio IA", icon: Sparkles, desc: "10 herramientas: staging, declutter, enhance, sky, twilight, pool, lawn, style change. 8 estilos disponibles.", chips: ["Staging", "Twilight", "Sky"] },
          { key: "portal", label: "Portal público", icon: Globe, desc: "6 plantillas premium: HomeIQ, Cinematic, Luxury Dark, Tropical, Minimal, Bold. Personalización completa.", chips: ["6 templates", "Branding", "SEO"] },
          { key: "agenda", label: "Agenda", icon: Calendar, desc: "Vista mes/lista/kanban. Recordatorios 15min/1h/1d/1w. Sincronización con WhatsApp + email.", chips: ["Calendar", "Recordatorios", "Sync"] },
          { key: "marketing", label: "Marketing IA", icon: Megaphone, desc: "Genera captions, hashtags, posts, campañas Meta-style. AI by Gemini. Multi-canal.", chips: ["Posts", "Captions", "Hashtags"] },
          { key: "finance", label: "Finanzas", icon: Wallet, desc: "Ingresos + gastos por propiedad. Comisiones automáticas. Reportes mensuales.", chips: ["P&L", "Comisiones", "Reports"] },
          { key: "team", label: "Equipos", icon: Users, desc: "Agencia con branding propio. Multi-usuario con roles. Pipeline compartido. Plan Agency.", chips: ["Multi-user", "Roles", "White-label"] },
          { key: "api", label: "API", icon: Code2, desc: "REST API + Webhooks. Integra con tu MLS, Zapier, n8n. Plan Team y superior.", chips: ["REST", "Webhooks", "MLS"] },
        ]
      : [
          { key: "crm", label: "CRM", icon: KanbanSquare, desc: "Kanban pipeline with 6 stages. Drag & drop. Notes, next actions, auto reminders.", chips: ["Contacts", "Properties", "Pipeline"] },
          { key: "studio", label: "AI Studio", icon: Sparkles, desc: "10 tools: staging, declutter, enhance, sky, twilight, pool, lawn, style change. 8 styles available.", chips: ["Staging", "Twilight", "Sky"] },
          { key: "portal", label: "Public portal", icon: Globe, desc: "6 premium templates: HomeIQ, Cinematic, Luxury Dark, Tropical, Minimal, Bold. Full customization.", chips: ["6 templates", "Branding", "SEO"] },
          { key: "agenda", label: "Agenda", icon: Calendar, desc: "Month/list/kanban views. 15min/1h/1d/1w reminders. WhatsApp + email sync.", chips: ["Calendar", "Reminders", "Sync"] },
          { key: "marketing", label: "AI Marketing", icon: Megaphone, desc: "Generate captions, hashtags, posts, Meta-style campaigns. AI by Gemini. Multi-channel.", chips: ["Posts", "Captions", "Hashtags"] },
          { key: "finance", label: "Finance", icon: Wallet, desc: "Income + expenses per property. Auto commissions. Monthly reports.", chips: ["P&L", "Commissions", "Reports"] },
          { key: "team", label: "Teams", icon: Users, desc: "Agency with own branding. Multi-user with roles. Shared pipeline. Agency plan.", chips: ["Multi-user", "Roles", "White-label"] },
          { key: "api", label: "API", icon: Code2, desc: "REST API + Webhooks. Integrate with your MLS, Zapier, n8n. Team plan and up.", chips: ["REST", "Webhooks", "MLS"] },
        ];

  return (
    <section
      id="modules"
      className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32"
    >
      <div className="mb-14 text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55">
          <span className="h-px w-6 bg-white/20" />
          {lang === "es" ? "Todo en uno" : "All in one"}
          <span className="h-px w-6 bg-white/20" />
        </p>
        <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {lang === "es" ? "8 módulos," : "8 modules,"}{" "}
          <span className="bg-gradient-to-br from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {lang === "es" ? "1 plataforma" : "1 platform"}
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">
          {lang === "es"
            ? "Reemplaza HubSpot + Canva + Photoshop + 5 herramientas más. Una sola suscripción."
            : "Replace HubSpot + Canva + Photoshop + 5 more tools. One subscription."}
        </p>
      </div>

      {/* Tabs scrollable */}
      <div className="mb-6 hide-scrollbar flex gap-2 overflow-x-auto pb-2">
        {modules.map((m, i) => (
          <button
            key={m.key}
            onClick={() => setActive(i)}
            className={cn(
              "group inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
              active === i
                ? "border-violet-500/40 bg-violet-500/15 text-white"
                : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/30 hover:bg-white/5"
            )}
          >
            <m.icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            {m.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.04] via-transparent to-cyan-500/[0.04] p-8 lg:p-12"
      >
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-3xl font-bold tracking-tight">{modules[active].label}</h3>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">
              {modules[active].desc}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {modules[active].chips.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/85"
                >
                  <span className="h-1 w-1 rounded-full bg-violet-400" />
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-500/20 p-6">
            <div className="flex h-full items-center justify-center">
              {(() => {
                const Icon = modules[active].icon;
                return <Icon className="h-24 w-24 text-violet-300/60" strokeWidth={1} aria-hidden />;
              })()}
            </div>
          </div>
        </div>
      </motion.div>

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

// ============================================================
// PROMISE TRANSPARENCY (when 60s guarantee applies)
// ============================================================

function PromiseTransparency() {
  const { lang } = useLang();
  const conditions =
    lang === "es"
      ? [
          { icon: Clock, title: "24/7 con créditos disponibles", body: "Tus generaciones IA están disponibles las 24 horas. Mientras tengas créditos en tu plan, la promesa de 60s aplica." },
          { icon: Camera, title: "Fotos hasta 4K", body: "Funciona con fotos hasta 4K (3840×2160). Fotos más grandes pueden tomar 60-120 segundos. Recomendamos 1080p–2K para resultados óptimos." },
          { icon: Wand2, title: "Para Studio IA", body: "La promesa aplica a Staging, Declutter, Enhance, Sky, Twilight, Pool y Lawn. Style Change toma 90s por su naturaleza generativa." },
        ]
      : [
          { icon: Clock, title: "24/7 with credits available", body: "Your AI generations are available 24/7. As long as you have credits in your plan, the 60s promise applies." },
          { icon: Camera, title: "Photos up to 4K", body: "Works with photos up to 4K (3840×2160). Larger photos can take 60-120 seconds. We recommend 1080p–2K for optimal results." },
          { icon: Wand2, title: "For AI Studio", body: "The promise applies to Staging, Declutter, Enhance, Sky, Twilight, Pool and Lawn. Style Change takes 90s due to its generative nature." },
        ];

  return (
    <section className="relative z-10 mx-auto max-w-5xl px-6 py-20 lg:px-10">
      <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-white/[0.02] p-8 lg:p-12">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-400">
            <span className="h-px w-6 bg-emerald-400" />
            {lang === "es" ? "Transparencia" : "Transparency"}
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">
            {lang === "es" ? "Entrega garantizada en" : "Guaranteed delivery in"}{" "}
            <span className="text-emerald-400">60s</span>
          </h2>
          <p className="mt-3 text-sm text-white/65">
            {lang === "es"
              ? "Cuándo aplica la promesa — sin letra chica"
              : "When the promise applies — no fine print"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {conditions.map((c) => (
            <div key={c.title}>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
                <c.icon className="h-5 w-5 text-emerald-400" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="font-semibold">{c.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TESTIMONIALS — specific data + brokerage
// ============================================================

function Testimonials() {
  const { lang } = useLang();
  const items =
    lang === "es"
      ? [
          {
            quote: "Pasé de 4 horas en Photoshop a 47 segundos por imagen. Mi primer mes cerré 3 propiedades más.",
            name: "María Hernández",
            role: "Bávaro Realty",
          },
          {
            quote: "Cerré una venta a 8% sobre precio listado usando el portal Cinematic. El cliente dijo \"esto se ve como Aman\".",
            name: "Carlos Vidal",
            role: "Cap Cana Estates",
          },
          {
            quote: "23 visitas y 4 ofertas en los primeros 6 días con el listing en plan Agency. Antes me tomaba 3 semanas.",
            name: "Pedro Reyes",
            role: "Punta Cana Pro",
          },
          {
            quote: "Empezamos gratis y a los 60 días pasamos a Agency. ROI absurdo: cada dólar generó $42.",
            name: "Ana Cruz",
            role: "Caribe Homes",
          },
          {
            quote: "El staging IA es brutal. Mis clientes piensan que contraté un fotógrafo profesional.",
            name: "Roberto Núñez",
            role: "DR Brokers",
          },
          {
            quote: "Reemplacé HubSpot + Canva + Photoshop. Ahorré $180/mes y trabajo 6 horas menos a la semana.",
            name: "Sofía Ramírez",
            role: "Casa Linda",
          },
        ]
      : [
          {
            quote: "Went from 4 hours in Photoshop to 47 seconds per image. First month I closed 3 more properties.",
            name: "Maria Hernandez",
            role: "Bavaro Realty",
          },
          {
            quote: "Closed a sale 8% over list price using the Cinematic portal. Client said \"this looks like Aman\".",
            name: "Carlos Vidal",
            role: "Cap Cana Estates",
          },
          {
            quote: "23 showings and 4 offers in our first 6 days with the Agency listing. Before it took me 3 weeks.",
            name: "Pedro Reyes",
            role: "Punta Cana Pro",
          },
          {
            quote: "We started free and at 60 days moved to Agency. Absurd ROI: every dollar generated $42.",
            name: "Ana Cruz",
            role: "Caribe Homes",
          },
          {
            quote: "AI staging is brutal. My clients think I hired a pro photographer.",
            name: "Roberto Nuñez",
            role: "DR Brokers",
          },
          {
            quote: "Replaced HubSpot + Canva + Photoshop. Saved $180/mo and work 6 fewer hours a week.",
            name: "Sofia Ramirez",
            role: "Casa Linda",
          },
        ];

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <div className="mb-12 text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55">
          <span className="h-px w-6 bg-white/20" />
          {lang === "es" ? "Resultados reales" : "Real results"}
          <span className="h-px w-6 bg-white/20" />
        </p>
        <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {lang === "es" ? "Lo que dicen" : "What our"}{" "}
          <span className="bg-gradient-to-br from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {lang === "es" ? "nuestros clientes" : "customers say"}
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20"
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className="h-3.5 w-3.5 text-amber-400"
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden
                />
              ))}
            </div>
            <blockquote className="mt-4 text-[15px] leading-relaxed text-white/85">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-semibold">
                {t.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-white/55">{t.role}</p>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// COMPREHENSIVE SERVICES — with explicit prices
// ============================================================

function ComprehensiveServices() {
  const { lang } = useLang();
  const services =
    lang === "es"
      ? [
          { icon: Wand2, label: "Virtual Staging", price: "$0.10", per: "/foto · 2 créditos" },
          { icon: Sparkles, label: "Declutter / vaciar", price: "$0.05", per: "/foto · 1 crédito" },
          { icon: Camera, label: "Enhance (mejorar)", price: "$0.05", per: "/foto · 1 crédito" },
          { icon: Sparkles, label: "Style Change", price: "$0.10", per: "/foto · 2 créditos" },
          { icon: Sparkles, label: "Sky replacement", price: "$0.05", per: "/foto · 1 crédito" },
          { icon: Sparkles, label: "Twilight (atardecer)", price: "$0.05", per: "/foto · 1 crédito" },
          { icon: Globe, label: "Portal premium", price: "$0", per: "Incluido todos los planes" },
          { icon: Mail, label: "Marketing IA (post)", price: "$0", per: "Incluido todos los planes" },
        ]
      : [
          { icon: Wand2, label: "Virtual Staging", price: "$0.10", per: "/photo · 2 credits" },
          { icon: Sparkles, label: "Declutter", price: "$0.05", per: "/photo · 1 credit" },
          { icon: Camera, label: "Enhance", price: "$0.05", per: "/photo · 1 credit" },
          { icon: Sparkles, label: "Style Change", price: "$0.10", per: "/photo · 2 credits" },
          { icon: Sparkles, label: "Sky replacement", price: "$0.05", per: "/photo · 1 credit" },
          { icon: Sparkles, label: "Twilight", price: "$0.05", per: "/photo · 1 credit" },
          { icon: Globe, label: "Premium portal", price: "$0", per: "All plans" },
          { icon: Mail, label: "AI Marketing (post)", price: "$0", per: "All plans" },
        ];

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <div className="mb-12 max-w-3xl">
        <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55">
          <span className="h-px w-6 bg-white/20" />
          {lang === "es" ? "Servicios completos" : "Comprehensive services"}
        </p>
        <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {lang === "es"
            ? "Marketing inmobiliario integral con "
            : "Comprehensive real estate marketing with "}
          <span className="bg-gradient-to-br from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {lang === "es" ? "precios transparentes" : "transparent pricing"}
          </span>
        </h2>
        <p className="mt-4 text-base text-white/65">
          {lang === "es"
            ? "Desde virtual staging hasta planos renderizados, ofrecemos soluciones completas para que tus listings impresionen."
            : "From virtual staging to floor plan renders, we offer comprehensive solutions to ensure your property listings impress."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => (
          <div
            key={s.label}
            className="group flex flex-col gap-3 bg-[#0a0a0c] p-6 transition-colors hover:bg-white/[0.02]"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-violet-500/30">
              <s.icon className="h-4 w-4 text-violet-400" strokeWidth={1.75} aria-hidden />
            </div>
            <h3 className="font-semibold tracking-tight">{s.label}</h3>
            <div className="flex items-baseline gap-1.5">
              <p className="font-mono text-2xl font-bold tabular-nums">{s.price}</p>
              <p className="text-xs text-white/55">{s.per}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// CASE STUDY — one big number hook
// ============================================================

function CaseStudy() {
  const { lang } = useLang();
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/[0.08] via-transparent to-fuchsia-500/[0.08] p-10 sm:p-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="text-center lg:text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-400">
              {lang === "es" ? "Caso de estudio" : "Case study"}
            </p>
            <p
              className="mt-3 font-bold leading-none tabular-nums"
              style={{ fontSize: "clamp(64px, 14vw, 180px)" }}
            >
              <span className="bg-gradient-to-br from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                +8%
              </span>
            </p>
            <p className="mt-2 text-sm text-white/65">
              {lang === "es"
                ? "Sobre precio de lista, en 18 días."
                : "Over list price, in 18 days."}
            </p>
          </div>
          <div>
            <blockquote
              className="text-balance text-xl font-light leading-[1.4] sm:text-2xl"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              &ldquo;
              {lang === "es"
                ? "Firmamos una oferta el miércoles, alrededor de un 8% sobre el precio de lista. Zillow mostró 1,800 vistas del listing entre domingo y miércoles vs. 200 promedio de 'listings similares'. Creo que el virtual staging explica gran parte."
                : "We signed an offer Wednesday, about 8% over list price. Zillow showed 1,800 listing views Sunday through Wednesday vs. 200 average for 'similar listings'. I think virtual staging accounts for most of it."}
              &rdquo;
            </blockquote>
            <p className="mt-6 flex items-center gap-3 text-sm text-white/70">
              <span className="h-px w-8 bg-white/30" />
              <span className="font-semibold text-white">Bob Hucker</span>
              <span>· Cap Cana Realty</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// DIFFERENTIATOR — proprietary tech
// ============================================================

function Differentiator() {
  const { lang } = useLang();
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-28">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-violet-400">
            <span className="h-px w-6 bg-violet-400" />
            {lang === "es" ? "Diferencia técnica" : "Technical difference"}
          </p>
          <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            {lang === "es" ? "Construido específicamente" : "Built specifically"}{" "}
            <span className="bg-gradient-to-br from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              {lang === "es" ? "para real estate" : "for real estate"}
            </span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/70">
            {lang === "es"
              ? "No es un CRM genérico con plugin de IA. Cada módulo —captación, valoración, staging, firma, postventa— está construido para el ciclo real de una operación inmobiliaria. Por eso nuestros clientes lo activan en horas, no en meses."
              : "Not a generic CRM with an AI plugin. Each module —lead capture, valuation, staging, signing, post-sale— is built for the real cycle of a real estate transaction. That's why our customers activate it in hours, not months."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "Gemini 2.5", desc: lang === "es" ? "Nano Banana AI" : "Nano Banana AI", icon: Sparkles },
            { name: "Mapbox", desc: lang === "es" ? "Mapas + geocoding" : "Maps + geocoding", icon: Globe },
            { name: "PayPal", desc: lang === "es" ? "Billing seguro" : "Secure billing", icon: ShieldCheck },
            { name: "Better-Auth", desc: lang === "es" ? "Auth + sesiones" : "Auth + sessions", icon: Lock },
            { name: "Next.js 16", desc: lang === "es" ? "Performance pro" : "Pro performance", icon: Zap },
            { name: "Prisma 7", desc: lang === "es" ? "ORM + migrations" : "ORM + migrations", icon: Code2 },
          ].map((tech) => (
            <div
              key={tech.name}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-white/20"
            >
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-violet-500/10 ring-1 ring-violet-500/30">
                <tech.icon className="h-3.5 w-3.5 text-violet-400" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="text-sm font-semibold">{tech.name}</p>
              <p className="text-xs text-white/55">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// PRICING
// ============================================================

function Pricing() {
  const { t } = useLang();
  const plans = [
    { key: "free", ...t.pricing.plans.free },
    { key: "pro", ...t.pricing.plans.pro },
    { key: "team", ...t.pricing.plans.team, featured: true },
  ];

  return (
    <section
      id="pricing"
      className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32"
    >
      <div className="mb-12 text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55">
          <span className="h-px w-6 bg-white/20" />
          {t.pricing.eyebrow}
          <span className="h-px w-6 bg-white/20" />
        </p>
        <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {t.pricing.title1}{" "}
          <span className="bg-gradient-to-br from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {t.pricing.title2}
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">{t.pricing.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const isFeatured = "featured" in p && p.featured;
          return (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className={cn(
                "relative rounded-2xl border p-7 transition-all",
                isFeatured
                  ? "border-violet-500/40 bg-gradient-to-b from-violet-500/[0.08] to-transparent shadow-2xl shadow-violet-500/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              )}
            >
              {isFeatured && (
                <span className="absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-500/30">
                  <Sparkles className="h-2.5 w-2.5" /> {p.tag}
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-mono text-5xl font-bold tabular-nums">${p.price}</span>
                <span className="text-sm text-white/55">/mes</span>
              </div>
              <Link
                href="/signup"
                className={cn(
                  "group mt-5 flex w-full min-h-[48px] items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-all active:scale-[0.98] motion-reduce:transform-none",
                  isFeatured
                    ? "bg-white text-black hover:bg-white/90"
                    : "border border-white/15 text-white/90 hover:border-white/40 hover:bg-white/5 hover:text-white",
                  FOCUS_RING
                )}
              >
                {p.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
              </Link>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span className="text-white/75">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// FINAL CTA WITH AUTHORITY STATS
// ============================================================

function FinalCTAStats() {
  const { lang } = useLang();
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-6 py-24 lg:px-10 lg:py-32">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-500/20 p-12 text-center sm:p-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.4)_100%)]" />
        <div className="relative">
          <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            {lang === "es" ? "Empieza hoy" : "Start today"}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80">
            {lang === "es" ? (
              <>
                Según <strong className="text-white">NAR</strong>, el{" "}
                <strong className="text-white">90%</strong> de compradores buscan su próxima casa
                online. Según <strong className="text-white">RESA</strong>, las casas con staging se
                venden <strong className="text-white">73% más rápido</strong>. Sin AI staging +
                portal premium, dejas dinero en la mesa cada semana.
              </>
            ) : (
              <>
                Per <strong className="text-white">NAR</strong>,{" "}
                <strong className="text-white">90%</strong> of buyers find their next home online.
                Per <strong className="text-white">RESA</strong>, staged homes sell{" "}
                <strong className="text-white">73% faster</strong>. Without AI staging + premium
                portal, you're leaving money on the table every week.
              </>
            )}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className={cn(
                "group inline-flex min-h-[52px] items-center gap-2 rounded-lg bg-white px-7 text-base font-semibold text-black transition-all hover:scale-[1.02] hover:bg-white/90 active:scale-[0.98] motion-reduce:transform-none",
                FOCUS_RING
              )}
            >
              {lang === "es" ? "Empezar gratis · 5 créditos" : "Start free · 5 credits"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
            </Link>
            <p className="text-xs text-white/65">
              {lang === "es"
                ? "Sin tarjeta · cancela cuando quieras · 30 días garantía"
                : "No card · cancel anytime · 30-day guarantee"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FAQ — extensive, segmented
// ============================================================

function FAQ() {
  const { lang } = useLang();
  const general =
    lang === "es"
      ? [
          { q: "¿Qué es estaila?", a: "Un CRM inmobiliario con Studio de IA integrado para staging fotorrealista, portales públicos con 6 plantillas premium, pipeline kanban, agenda, marketing automatizado y finanzas. Todo en una sola plataforma." },
          { q: "¿Por qué un CRM vertical y no HubSpot o Salesforce?", a: "Porque HubSpot no genera virtual staging en 60 segundos, no tiene plantillas de portales inmobiliarios premium, no integra Mapbox con POIs reales, ni sabe la diferencia entre 'En Venta' y 'Consignación'. Cada módulo nuestro está pensado para el ciclo real de una operación inmobiliaria." },
          { q: "¿Funciona para inmobiliarias pequeñas o solo agencias?", a: "Funciona perfecto para agentes solo, equipos pequeños (Team) y agencias (Agency). El plan Free es real, sin tarjeta — pruébalo." },
          { q: "¿En qué idiomas funciona?", a: "Español e inglés. La interfaz es bilingüe y los portales pueden configurarse en cualquiera de los dos." },
        ]
      : [
          { q: "What is estaila?", a: "A real estate CRM with built-in AI Studio for photorealistic staging, public portals with 6 premium templates, kanban pipeline, agenda, automated marketing and finance. All in one platform." },
          { q: "Why a vertical CRM instead of HubSpot or Salesforce?", a: "Because HubSpot doesn't generate virtual staging in 60 seconds, doesn't have premium real estate portal templates, doesn't integrate Mapbox with real POIs, and doesn't know the difference between 'For Sale' and 'Consignment'. Each of our modules is designed for the real cycle of a real estate transaction." },
          { q: "Does it work for small agencies or just brokerages?", a: "Works perfectly for solo agents, small teams (Team) and agencies (Agency). The Free plan is real, no card — try it." },
          { q: "What languages does it support?", a: "Spanish and English. Interface is bilingual and portals can be set to either." },
        ];

  const product =
    lang === "es"
      ? [
          { q: "¿Cuánto cuesta?", a: "Plan Free: $0/mes con 5 créditos IA. Pro: $15/mes con 50 créditos + propiedades ilimitadas. Team: $39/mes con 200 créditos + 5 asientos + branding. Agency: $79/mes con 1000 créditos + 15 asientos + dominio propio + white-label." },
          { q: "¿Cuánto tarda el onboarding?", a: "Setup completo en 5 minutos. Crea cuenta → sube primera propiedad → genera primera imagen IA. Si necesitas migrar desde otro CRM, te ayudamos gratis en una videollamada (planes Pro+)." },
          { q: "¿Migráis desde HubSpot / Sherlock / Inmobiliaria 360?", a: "Sí. Importamos CSV/Excel con tus contactos y propiedades. Para migraciones complejas (datos sucios, archivos viejos), el plan Agency incluye soporte de migración asistida." },
          { q: "¿Tenéis app móvil?", a: "Web responsive optimizada para móvil. App nativa iOS/Android en roadmap Q1 2027." },
          { q: "¿Cómo funciona el Studio IA?", a: "Sube foto vacía → elige tool (Staging/Twilight/Sky/etc) y estilo → IA genera en 60 segundos. Usa Gemini 2.5 Flash Image (Nano Banana) de Google. Preserva paredes/ventanas/columnas, solo cambia decoración." },
          { q: "¿Cuántas fotos puedo procesar al mes?", a: "Free: 5 créditos. Pro: 50. Team: 200. Agency: 1000. Cada generación cuesta 1-2 créditos. Puedes comprar packs adicionales ($9 = 20 créditos, $19 = 50, $49 = 150)." },
          { q: "¿Qué pasa si no me convence el resultado IA?", a: "Tienes regeneraciones ilimitadas dentro del crédito. Si después de 3 intentos no te convence, te devolvemos el crédito sin preguntas." },
          { q: "¿Hay integraciones con MLS?", a: "REST API + Webhooks en plan Team y superior. Integramos con MLS via partners. Zapier + n8n soportados." },
          { q: "¿Qué pasa si cancelo?", a: "Conservas tu data 90 días. Puedes exportar todo en CSV. Sin penalizaciones, sin preguntas." },
          { q: "¿Ofrecéis formación al equipo?", a: "Plan Team: 1 hora de onboarding gratuita. Plan Agency: 3 sesiones + manual de mejores prácticas + acceso prioritario al equipo." },
        ]
      : [
          { q: "How much does it cost?", a: "Free plan: $0/mo with 5 AI credits. Pro: $15/mo with 50 credits + unlimited properties. Team: $39/mo with 200 credits + 5 seats + branding. Agency: $79/mo with 1000 credits + 15 seats + custom domain + white-label." },
          { q: "How long is onboarding?", a: "Full setup in 5 minutes. Create account → upload first property → generate first AI image. If you need to migrate from another CRM, we help you free on a video call (Pro+ plans)." },
          { q: "Do you migrate from HubSpot / Sherlock?", a: "Yes. We import CSV/Excel with your contacts and properties. For complex migrations, Agency plan includes assisted migration support." },
          { q: "Do you have a mobile app?", a: "Mobile-optimized responsive web. Native iOS/Android app in Q1 2027 roadmap." },
          { q: "How does AI Studio work?", a: "Upload empty photo → pick tool (Staging/Twilight/Sky/etc) and style → AI generates in 60 seconds. Uses Google's Gemini 2.5 Flash Image (Nano Banana). Preserves walls/windows/columns, only changes decoration." },
          { q: "How many photos can I process per month?", a: "Free: 5 credits. Pro: 50. Team: 200. Agency: 1000. Each generation costs 1-2 credits. You can buy additional packs ($9 = 20 credits, $19 = 50, $49 = 150)." },
          { q: "What if I don't like the AI result?", a: "You have unlimited regenerations within the credit. After 3 attempts you're still not satisfied, we refund the credit, no questions." },
          { q: "Are there MLS integrations?", a: "REST API + Webhooks on Team plan and up. We integrate with MLS via partners. Zapier + n8n supported." },
          { q: "What if I cancel?", a: "You keep your data for 90 days. You can export everything in CSV. No penalties, no questions." },
          { q: "Do you offer team training?", a: "Team plan: 1 hour of free onboarding. Agency plan: 3 sessions + best-practices manual + priority team access." },
        ];

  return (
    <section id="faq" className="relative z-10 mx-auto max-w-4xl px-6 py-24 lg:px-10 lg:py-32">
      <div className="mb-14 text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55">
          <span className="h-px w-6 bg-white/20" />
          FAQ
          <span className="h-px w-6 bg-white/20" />
        </p>
        <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {lang === "es" ? "Preguntas " : "Frequent "}
          <span className="bg-gradient-to-br from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {lang === "es" ? "frecuentes" : "questions"}
          </span>
        </h2>
      </div>

      <div className="mb-12">
        <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-violet-400">
          {lang === "es" ? "General" : "General"}
        </h3>
        <div className="space-y-2">
          {general.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-violet-400">
          {lang === "es" ? "Producto" : "Product"}
        </h3>
        <div className="space-y-2">
          {product.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const id = q.replace(/\W+/g, "-").slice(0, 40);
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:border-white/20 hover:bg-white/[0.04]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`faq-${id}`}
        className={cn(
          "flex w-full min-h-[56px] items-center justify-between gap-4 p-5 text-left",
          FOCUS_RING
        )}
      >
        <span className="font-medium text-white">{q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-white/70 transition-transform motion-reduce:transition-none",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <motion.div
        id={`faq-${id}`}
        initial={false}
        animate={{
          height: open ? "auto" : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ duration: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-sm leading-relaxed text-white/75">{a}</p>
      </motion.div>
    </div>
  );
}

// ============================================================
// FOOTER
// ============================================================

function Footer() {
  const { t } = useLang();
  return (
    <footer className="relative z-10 border-t border-white/5 bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <Link href="/welcome" className="inline-flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2.25} aria-hidden />
              </div>
              <span className="text-[15px] font-semibold">estaila</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-white/55">{t.footer.tagline}</p>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/55">
              {t.footer.links.product}
            </p>
            <ul className="space-y-2 text-sm">
              <li><a href="#how" className="text-white/70 hover:text-white">{t.footer.links.features}</a></li>
              <li><a href="#modules" className="text-white/70 hover:text-white">{t.footer.links.studio}</a></li>
              <li><a href="#templates" className="text-white/70 hover:text-white">{t.footer.links.templates}</a></li>
              <li><a href="#pricing" className="text-white/70 hover:text-white">{t.footer.links.pricing}</a></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/55">
              {t.footer.links.company}
            </p>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-white/70 hover:text-white">{t.footer.links.about}</a></li>
              <li><a href="#" className="text-white/70 hover:text-white">{t.footer.links.blog}</a></li>
              <li><a href="#" className="text-white/70 hover:text-white">{t.footer.links.privacy}</a></li>
              <li><a href="#" className="text-white/70 hover:text-white">{t.footer.links.terms}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-6 text-xs text-white/55 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} estaila. {t.footer.copyright}</p>
          <p className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Sistemas operativos
            </span>
            <span>·</span>
            <a href="#" className="hover:text-white">Status</a>
            <span>·</span>
            <a href="#" className="hover:text-white">Changelog</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
