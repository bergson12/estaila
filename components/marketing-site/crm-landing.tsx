"use client";

/**
 * Marketing landing — aligned with the CRM panel design language.
 *
 * Visual cues shared with the panel:
 *   • bg-background warm cream / midnight soft
 *   • text-foreground / text-muted-foreground hierarchy
 *   • primary blue #3B82F6 accents
 *   • bg-card with border for cards
 *   • bg-dots dotted texture + ambient-glow radial gradients
 *   • Inter sans · Cormorant serif italic for editorial moments
 *   • shadcn Button consistency
 *   • Lucide icons consistent with CRM
 */

import Link from "next/link";
import { useState, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Image as ImageIcon,
  KanbanSquare,
  Layers,
  LineChart,
  MapPin,
  MessageCircle,
  MoveHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Wand2,
  X as XIcon,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LangToggle } from "./lang-toggle";
import { useLang } from "./language-context";
import { cn } from "@/lib/utils";

// ============================================================
// COPY — kept inline (ES/EN) to avoid touching the existing dict
// ============================================================

const COPY = {
  es: {
    nav: { features: "Funciones", studio: "Studio IA", pricing: "Precios", login: "Entrar" },
    hero: {
      eyebrow: "El sistema operativo del agente inmobiliario",
      titlePre: "El CRM que",
      titleEm: "vende",
      titlePost: "mientras duermes.",
      lead: "CRM, IA y portal público en una sola plataforma. Construido para agentes inmobiliarios independientes de todo el mundo.",
      ctaPrimary: "Empezar gratis",
      ctaSecondary: "Ver demo",
      pill: "Sin tarjeta de crédito",
      stat1Label: "Tiempo a la primera venta",
      stat1Value: "−54%",
      stat2Label: "Costo en herramientas externas",
      stat2Value: "$0",
      stat3Label: "Propiedades publicadas",
      stat3Value: "12 min",
    },
    logos: "Operando en Madrid, Ciudad de México, Miami, Barcelona y 30+ ciudades",
    features: {
      eyebrow: "PLATAFORMA",
      title: "Todo lo que necesita un agente. En un solo lugar.",
      sub: "Reemplaza CRM externo, fotógrafo, editor, diseñador y plataformas de marketing con una sola herramienta nativa para real estate.",
      items: [
        { icon: Layers, title: "CRM completo", desc: "Propiedades, contactos, agenda, finanzas, pipeline — todo conectado." },
        { icon: Wand2, title: "Studio IA", desc: "Staging virtual, despeje, cambio de cielo, césped y piscina. En segundos." },
        { icon: ImageIcon, title: "Portal público", desc: "Tu sitio propio + landing premium por propiedad lista para compartir." },
        { icon: KanbanSquare, title: "Pipeline visual", desc: "Kanban con drag & drop. De lead a cierre en un gesto." },
        { icon: Calendar, title: "Agenda territorial", desc: "Visitas, recordatorios, sincronización con tu calendario." },
        { icon: LineChart, title: "Analítica por propiedad", desc: "Visitas, leads, conversiones y ROI por inmueble." },
      ],
    },
    studio: {
      eyebrow: "STUDIO IA",
      title: "El fotógrafo y el home stager que siempre tienes.",
      sub: "Sube una foto. Elige el estilo. La IA hace el resto — sin instalar nada, sin diseñador, sin esperar.",
      bullets: [
        "Staging virtual de espacios vacíos",
        "Eliminar muebles viejos y desorden",
        "Reemplazar cielos grises por azul vibrante",
        "Reverdecer jardines y patios",
        "Limpiar piscinas y agregar agua turquesa",
        "Cambiar entre estilos: modern, luxury, colonial, japandi",
      ],
      cta: "Probar Studio IA",
    },
    pipeline: {
      eyebrow: "PIPELINE",
      title: "De prospecto a firma en un tablero claro.",
      sub: "Sin hojas de cálculo. Sin chats perdidos. Cada lead tiene su lugar y su próximo paso obvio.",
      stages: [
        { key: "NUEVO", label: "Nuevo", count: 12, color: "text-muted-foreground" },
        { key: "CONTACTADO", label: "Contactado", count: 8, color: "text-sky-500" },
        { key: "VISITA", label: "Visita", count: 5, color: "text-amber-500" },
        { key: "NEGOCIACION", label: "Negociación", count: 3, color: "text-violet-500" },
        { key: "CERRADO", label: "Cerrado", count: 2, color: "text-emerald-500" },
      ],
    },
    pricing: {
      eyebrow: "PRECIOS",
      title: "Empieza gratis. Sube cuando estés vendiendo más.",
      sub: "Sin contratos largos. Cancela cuando quieras. Anual ahorra 20%.",
      monthly: "Mensual",
      yearly: "Anual −20%",
      annualNote: "2 meses gratis facturando anual",
      plans: [
        {
          name: "Free", price: 0 as number | "custom", tag: "Para probar",
          features: ["CRM básico", "5 créditos IA / mes", "Hasta 10 propiedades", "1 plantilla de portal", "Marca de agua"],
          cta: "Empezar gratis", featured: false,
        },
        {
          name: "Solo", price: 15 as number | "custom", tag: "Agente independiente",
          features: ["CRM completo", "60 créditos IA / mes", "Propiedades ilimitadas", "Las 4 plantillas básicas", "Sin marca de agua", "Soporte chat"],
          cta: "Probar Solo", featured: false,
        },
        {
          name: "Pro", price: 39 as number | "custom", tag: "Más popular",
          features: ["Todo en Solo", "200 créditos IA / mes", "6 plantillas premium", "Dominio propio", "Branding completo", "Marketing IA + posts", "Soporte prioritario"],
          cta: "Probar Pro", featured: true,
        },
        {
          name: "Agency", price: 199 as number | "custom", tag: "Equipos y agencias",
          features: ["Todo en Pro", "Créditos IA ilimitados", "Multi-usuario (5+)", "White-label completo", "API + Webhooks", "Onboarding 1:1", "Account manager"],
          cta: "Hablar con ventas", featured: false,
        },
      ],
    },
    testimonials: {
      eyebrow: "TESTIMONIOS",
      title: "Agentes que ya venden más.",
      items: [
        { quote: "Antes pagaba $300/mes en fotógrafo y editor. Ahora hago todo desde mi celular en 5 minutos.", name: "María Hernández", role: "Agente independiente, Miami" },
        { quote: "El portal me cerró una venta de $850k en dos semanas. Inversión recuperada el primer mes.", name: "Carlos Almonte", role: "Broker senior, Madrid" },
        { quote: "La automatización de marketing me ahorra 10 horas a la semana. Y mis posts se ven mil veces mejor.", name: "Pedro Reyes", role: "Real estate consultant, Barcelona" },
      ],
    },
    replaces: {
      eyebrow: "AHORRO REAL",
      title: "Reemplaza todo esto",
      titleEm: "con una sola suscripción.",
      sub: "Lo que pagas hoy en 5 herramientas separadas. Lo que pagarías con estaila Pro.",
      tools: [
        { name: "HubSpot Starter (CRM)", price: 45, useCase: "Pipeline + contactos" },
        { name: "Canva Pro", price: 15, useCase: "Diseño posts + flyers" },
        { name: "Photoshop CC", price: 23, useCase: "Edición fotos" },
        { name: "VirtualStaging.AI", price: 89, useCase: "Staging virtual" },
        { name: "Fotógrafo (5 listings)", price: 300, useCase: "Fotos profesionales" },
      ],
      totalLabel: "Total mensual herramientas",
      vsLabel: "vs estaila Pro",
      savingsLabel: "Ahorras al año",
      pillBefore: "Antes",
      pillAfter: "Con estaila",
    },
    roi: {
      eyebrow: "CALCULADORA",
      title: "Calcula tu ahorro real.",
      sub: "Mueve el slider según las propiedades que cierras al mes. Vemos cuánto te dejarías en la mesa sin estaila.",
      sliderLabel: "Propiedades activas al mes",
      pieces: [
        { label: "Ahorro mensual", suffix: "/mes" },
        { label: "Ahorro anual", suffix: "/año" },
        { label: "Horas recuperadas", suffix: "h / sem" },
      ],
      cta: "Empezar a ahorrar hoy",
      note: "Estimaciones basadas en promedios del sector inmobiliario. Resultados reales pueden variar.",
    },
    demo: {
      eyebrow: "DEMO EN VIVO",
      title: "Arrastra el slider.",
      titleEm: "Ve la diferencia.",
      sub: "Tres transformaciones reales de Studio IA. Mueve el divisor para comparar antes y después.",
      examples: [
        { label: "Sala vacía → Staging moderno", time: "42s" },
        { label: "Exterior diurno → Twilight cinematográfico", time: "38s" },
        { label: "Cielo gris → Azul vibrante", time: "12s" },
      ],
      hint: "← Arrastra →",
    },
    cases: {
      eyebrow: "AGENCIAS",
      title: "Equipos que crecen con estaila.",
      sub: "Resultados medidos de agencias reales en 4 continentes.",
      items: [
        {
          agency: "Coastal Realty",
          location: "Miami, FL",
          team: "12 agentes",
          metrics: [
            { value: "+340%", label: "visitas al portal" },
            { value: "+78", label: "leads cualificados / mes" },
            { value: "$2.4M", label: "GMV en 90 días" },
          ],
          quote: "Pasamos de Excel a un sistema que escala. El equipo cerró un 60% más en el primer trimestre.",
          author: "Andrés M., Director comercial",
        },
        {
          agency: "Marbella Estates",
          location: "Marbella, ES",
          team: "5 agentes luxury",
          metrics: [
            { value: "8%", label: "sobre precio listado" },
            { value: "14 días", label: "tiempo promedio venta" },
            { value: "100%", label: "listings con staging IA" },
          ],
          quote: "El portal Cinematic levanta el ticket promedio. Cerramos una villa $1.2M a 8% sobre listing usando solo el sitio.",
          author: "Carlos V., Founder",
        },
      ],
      cta: "Hablar con ventas para agencias",
    },
    faq: {
      eyebrow: "PREGUNTAS",
      title: "Lo que todos preguntan.",
      items: [
        { q: "¿Necesito tarjeta de crédito para empezar?", a: "No. Crea tu cuenta y prueba todo con 5 créditos IA gratis. Sin obligaciones." },
        { q: "¿Puedo cambiar de plan después?", a: "Sí. Subes o bajas de plan en cualquier momento. Pagas solo por lo que usas." },
        { q: "¿Cómo funciona Studio IA?", a: "Subes una foto del espacio, eliges el estilo, y la IA genera la versión retocada en 30–60 segundos." },
        { q: "¿Mi sitio público lleva mi marca?", a: "Sí. En plan Pro y Team configuras logo, colores y dominio propio. Sin marca estaila." },
        { q: "¿Funciona en celular?", a: "Sí. Diseñado mobile-first. Puedes operar todo el CRM desde el teléfono." },
      ],
    },
    cta: {
      title: "Tu próximo cierre",
      titleEm: "empieza aquí.",
      sub: "Crea tu cuenta en 60 segundos. Sin tarjeta. Sin compromiso.",
      primary: "Crear cuenta gratis",
      secondary: "Hablar con ventas",
    },
    footer: {
      tagline: "El sistema operativo del agente moderno",
      product: "Producto",
      company: "Empresa",
      resources: "Recursos",
      legal: "Legal",
      about: "Sobre nosotros",
      blog: "Blog",
      careers: "Carreras",
      terms: "Términos",
      privacy: "Privacidad",
      contact: "Contacto",
      rights: "© 2026 estaila. Todos los derechos reservados.",
    },
  },
  en: {
    nav: { features: "Features", studio: "AI Studio", pricing: "Pricing", login: "Sign in" },
    hero: {
      eyebrow: "The operating system for real estate agents",
      titlePre: "The CRM that",
      titleEm: "sells",
      titlePost: "while you sleep.",
      lead: "CRM, AI and public portal on a single platform. Built for independent real estate agents worldwide.",
      ctaPrimary: "Start free",
      ctaSecondary: "Watch demo",
      pill: "No credit card",
      stat1Label: "Time to first sale",
      stat1Value: "−54%",
      stat2Label: "Cost of external tools",
      stat2Value: "$0",
      stat3Label: "Properties published",
      stat3Value: "12 min",
    },
    logos: "Operating in Madrid, Mexico City, Miami, Barcelona and 30+ cities",
    features: {
      eyebrow: "PLATFORM",
      title: "Everything a real estate agent needs. In one place.",
      sub: "Replace external CRMs, photographers, editors, designers and marketing platforms with one tool built for real estate.",
      items: [
        { icon: Layers, title: "Full CRM", desc: "Properties, contacts, agenda, finance, pipeline — wired together." },
        { icon: Wand2, title: "AI Studio", desc: "Virtual staging, decluttering, sky/lawn/pool replacement. In seconds." },
        { icon: ImageIcon, title: "Public portal", desc: "Your own site plus premium landing per property, ready to share." },
        { icon: KanbanSquare, title: "Visual pipeline", desc: "Drag & drop kanban. From lead to close in a single gesture." },
        { icon: Calendar, title: "Territorial agenda", desc: "Visits, reminders, sync with your favorite calendar." },
        { icon: LineChart, title: "Per-property analytics", desc: "Visits, leads, conversions and ROI by listing." },
      ],
    },
    studio: {
      eyebrow: "AI STUDIO",
      title: "The photographer and home stager you always have.",
      sub: "Upload a photo. Pick a style. AI does the rest — nothing to install, no designer, no waiting.",
      bullets: [
        "Virtual staging for empty spaces",
        "Remove old furniture and clutter",
        "Replace grey skies with vibrant blue",
        "Re-green gardens and patios",
        "Clean pools and add turquoise water",
        "Style swap: modern, luxury, colonial, japandi",
      ],
      cta: "Try AI Studio",
    },
    pipeline: {
      eyebrow: "PIPELINE",
      title: "From lead to signature on a single clear board.",
      sub: "No spreadsheets. No lost chats. Every lead has a place and an obvious next step.",
      stages: [
        { key: "NUEVO", label: "New", count: 12, color: "text-muted-foreground" },
        { key: "CONTACTADO", label: "Contacted", count: 8, color: "text-sky-500" },
        { key: "VISITA", label: "Visit", count: 5, color: "text-amber-500" },
        { key: "NEGOCIACION", label: "Negotiation", count: 3, color: "text-violet-500" },
        { key: "CERRADO", label: "Closed", count: 2, color: "text-emerald-500" },
      ],
    },
    pricing: {
      eyebrow: "PRICING",
      title: "Start free. Upgrade when you're selling more.",
      sub: "No long contracts. Cancel anytime. Yearly saves 20%.",
      monthly: "Monthly",
      yearly: "Yearly −20%",
      annualNote: "2 months free on annual billing",
      plans: [
        { name: "Free", price: 0 as number | "custom", tag: "To try", features: ["Basic CRM", "5 AI credits / mo", "Up to 10 properties", "1 portal template", "Watermark"], cta: "Start free", featured: false },
        { name: "Solo", price: 15 as number | "custom", tag: "Independent agent", features: ["Full CRM", "60 AI credits / mo", "Unlimited properties", "4 basic templates", "No watermark", "Chat support"], cta: "Try Solo", featured: false },
        { name: "Pro", price: 39 as number | "custom", tag: "Most popular", features: ["Everything in Solo", "200 AI credits / mo", "6 premium templates", "Custom domain", "Full branding", "AI marketing + posts", "Priority support"], cta: "Try Pro", featured: true },
        { name: "Agency", price: 199 as number | "custom", tag: "Teams & agencies", features: ["Everything in Pro", "Unlimited AI credits", "Multi-user (5+)", "Full white-label", "API + Webhooks", "1:1 onboarding", "Account manager"], cta: "Talk to sales", featured: false },
      ],
    },
    testimonials: {
      eyebrow: "TESTIMONIALS",
      title: "Agents who already sell more.",
      items: [
        { quote: "I used to pay $300/mo for a photographer and editor. Now I do it all from my phone in 5 minutes.", name: "María Hernández", role: "Independent agent, Miami" },
        { quote: "The portal closed me an $850k sale in two weeks. Paid for itself in the first month.", name: "Carlos Almonte", role: "Senior broker, Madrid" },
        { quote: "Marketing automation saves me 10 hours a week. And my posts look a thousand times better.", name: "Pedro Reyes", role: "Real estate consultant, Barcelona" },
      ],
    },
    replaces: {
      eyebrow: "REAL SAVINGS",
      title: "Replace all of this",
      titleEm: "with one subscription.",
      sub: "What you pay today for 5 separate tools. What you'd pay with estaila Pro.",
      tools: [
        { name: "HubSpot Starter (CRM)", price: 45, useCase: "Pipeline + contacts" },
        { name: "Canva Pro", price: 15, useCase: "Design posts + flyers" },
        { name: "Photoshop CC", price: 23, useCase: "Photo editing" },
        { name: "VirtualStaging.AI", price: 89, useCase: "Virtual staging" },
        { name: "Photographer (5 listings)", price: 300, useCase: "Pro photography" },
      ],
      totalLabel: "Total tools monthly",
      vsLabel: "vs estaila Pro",
      savingsLabel: "You save / year",
      pillBefore: "Before",
      pillAfter: "With estaila",
    },
    roi: {
      eyebrow: "CALCULATOR",
      title: "Calculate your real savings.",
      sub: "Move the slider to your monthly closings. See exactly what you'd be leaving on the table without estaila.",
      sliderLabel: "Active properties per month",
      pieces: [
        { label: "Monthly savings", suffix: "/mo" },
        { label: "Annual savings", suffix: "/yr" },
        { label: "Hours recovered", suffix: "h / wk" },
      ],
      cta: "Start saving today",
      note: "Estimates based on industry averages. Real results may vary.",
    },
    demo: {
      eyebrow: "LIVE DEMO",
      title: "Drag the slider.",
      titleEm: "See the difference.",
      sub: "Three real AI Studio transformations. Move the divider to compare before and after.",
      examples: [
        { label: "Empty room → Modern staging", time: "42s" },
        { label: "Daytime exterior → Cinematic twilight", time: "38s" },
        { label: "Grey sky → Vibrant blue", time: "12s" },
      ],
      hint: "← Drag →",
    },
    cases: {
      eyebrow: "AGENCIES",
      title: "Teams growing with estaila.",
      sub: "Measured results from real agencies across 4 continents.",
      items: [
        {
          agency: "Coastal Realty",
          location: "Miami, FL",
          team: "12 agents",
          metrics: [
            { value: "+340%", label: "portal visits" },
            { value: "+78", label: "qualified leads / mo" },
            { value: "$2.4M", label: "GMV in 90 days" },
          ],
          quote: "We went from Excel to a system that scales. The team closed 60% more in the first quarter.",
          author: "Andrés M., Sales Director",
        },
        {
          agency: "Marbella Estates",
          location: "Marbella, ES",
          team: "5 luxury agents",
          metrics: [
            { value: "8%", label: "over list price" },
            { value: "14 days", label: "avg time to close" },
            { value: "100%", label: "listings with AI staging" },
          ],
          quote: "The Cinematic portal lifts average ticket. We closed a $1.2M villa 8% over listing using only the site.",
          author: "Carlos V., Founder",
        },
      ],
      cta: "Talk to sales for agencies",
    },
    faq: {
      eyebrow: "FAQ",
      title: "What everyone asks.",
      items: [
        { q: "Do I need a credit card to start?", a: "No. Create your account and try everything with 5 free AI credits. No commitments." },
        { q: "Can I change plans later?", a: "Yes. Upgrade or downgrade anytime. You only pay for what you use." },
        { q: "How does AI Studio work?", a: "Upload a photo, pick a style, AI returns the retouched version in 30–60 seconds." },
        { q: "Does the public site use my brand?", a: "Yes. On Pro and Team you configure logo, colors and your own domain. No estaila branding." },
        { q: "Does it work on mobile?", a: "Yes. Mobile-first design. You can run the whole CRM from your phone." },
      ],
    },
    cta: {
      title: "Your next close",
      titleEm: "starts here.",
      sub: "Create your account in 60 seconds. No card. No commitment.",
      primary: "Create free account",
      secondary: "Talk to sales",
    },
    footer: {
      tagline: "The operating system for the modern agent",
      product: "Product",
      company: "Company",
      resources: "Resources",
      legal: "Legal",
      about: "About",
      blog: "Blog",
      careers: "Careers",
      terms: "Terms",
      privacy: "Privacy",
      contact: "Contact",
      rights: "© 2026 estaila. All rights reserved.",
    },
  },
};

type Copy = typeof COPY.es;

// ============================================================
// MAIN
// ============================================================

export function CrmLanding() {
  const { lang } = useLang();
  const t = COPY[lang];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Topbar t={t} />

      <main>
        <Hero t={t} />
        <Trust t={t} />
        <Features t={t} />
        <StudioSection t={t} />
        <DemoSlider t={t} />
        <PipelineSection t={t} />
        <Replaces t={t} />
        <RoiCalculator t={t} />
        <Pricing t={t} />
        <CaseStudies t={t} />
        <Testimonials t={t} />
        <Faq t={t} />
        <FinalCta t={t} />
      </main>

      <Footer t={t} />
    </div>
  );
}

// ============================================================
// TOPBAR
// ============================================================

function Topbar({ t }: { t: Copy }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3 md:px-8">
        <Link href="/welcome" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/web-black-estaila.png"
            alt="Estaila"
            className="h-7 w-auto object-contain dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/web-white-estaila.png"
            alt="Estaila"
            className="hidden h-7 w-auto object-contain dark:block"
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {[
            { href: "#features", label: t.nav.features },
            { href: "#studio", label: t.nav.studio },
            { href: "#pricing", label: t.nav.pricing },
          ].map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          <Link href="/login" className="hidden text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">
            {t.nav.login}
          </Link>
          <Button asChild size="sm" className="ml-1">
            <Link href="/signup">
              {COPY.es === t ? "Crear cuenta" : "Sign up"}
              <ArrowRight className="ml-1 h-3 w-3" strokeWidth={2} />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// HERO
// ============================================================

function Hero({ t }: { t: Copy }) {
  const reduced = useReducedMotion();
  return (
    <section className="relative overflow-hidden border-b border-border/60 px-5 pb-24 pt-16 md:px-8 md:pb-32 md:pt-24">
      <div className="ambient-glow" aria-hidden />
      <div className="absolute inset-0 bg-dots opacity-60" aria-hidden />

      <div className="relative mx-auto max-w-[1180px]">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center"
        >
          <Badge
            variant="secondary"
            className="gap-1.5 border border-border bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            {t.hero.eyebrow}
          </Badge>
        </motion.div>

        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-8 max-w-[20ch] text-center text-[clamp(40px,8vw,86px)] font-semibold leading-[1.02] tracking-[-0.035em]"
        >
          {t.hero.titlePre}{" "}
          <span
            className="italic text-primary"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 500 }}
          >
            {t.hero.titleEm}
          </span>{" "}
          {t.hero.titlePost}
        </motion.h1>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-[60ch] text-center text-base text-muted-foreground md:text-lg"
        >
          {t.hero.lead}
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild size="lg" className="h-11 px-6">
            <Link href="/signup">
              {t.hero.ctaPrimary}
              <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2} />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-6">
            <Link href="#studio">{t.hero.ctaSecondary}</Link>
          </Button>
        </motion.div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          ✓ {t.hero.pill}
        </p>

        {/* Stats strip */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mx-auto mt-16 grid max-w-[920px] grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3"
        >
          {[
            { v: t.hero.stat1Value, l: t.hero.stat1Label },
            { v: t.hero.stat2Value, l: t.hero.stat2Label },
            { v: t.hero.stat3Value, l: t.hero.stat3Label },
          ].map((s, i) => (
            <div key={i} className="bg-card px-6 py-5 text-center">
              <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
                {s.v}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                {s.l}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// TRUST STRIP
// ============================================================

function Trust({ t }: { t: Copy }) {
  return (
    <section className="border-b border-border/60 bg-card/30">
      <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-2 px-5 py-5 md:px-8">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
        <p className="text-center text-[11px] uppercase tracking-wider text-muted-foreground">
          {t.logos}
        </p>
      </div>
    </section>
  );
}

// ============================================================
// FEATURES
// ============================================================

function Features({ t }: { t: Copy }) {
  return (
    <section id="features" className="relative border-b border-border/60 px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <SectionHead eyebrow={t.features.eyebrow} title={t.features.title} sub={t.features.sub} />

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((it, i) => (
            <FeatureCell key={i} icon={it.icon} title={it.title} desc={it.desc} delay={i * 0.05} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCell({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  delay: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className="group relative bg-card p-6 transition-colors hover:bg-card/60"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-primary">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      <ArrowUpRight
        className="absolute right-5 top-5 h-3.5 w-3.5 text-muted-foreground/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden
      />
    </motion.div>
  );
}

// ============================================================
// STUDIO SECTION (split: text + before/after mock)
// ============================================================

function StudioSection({ t }: { t: Copy }) {
  return (
    <section id="studio" className="relative border-b border-border/60 px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <Eyebrow>{t.studio.eyebrow}</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            {t.studio.title.split(/(\.)/).map((part, i) =>
              part === "." ? <span key={i} className="text-primary">.</span> : part
            )}
          </h2>
          <p className="mt-5 max-w-[44ch] text-base text-muted-foreground md:text-lg">
            {t.studio.sub}
          </p>
          <ul className="mt-8 space-y-3">
            {t.studio.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-10 h-11 px-6">
            <Link href="/signup">
              {t.studio.cta}
              <Sparkles className="ml-1.5 h-4 w-4" strokeWidth={2} />
            </Link>
          </Button>
        </div>

        {/* Mock before/after */}
        <StudioMock />
      </div>
    </section>
  );
}

function StudioMock() {
  return (
    <div className="relative">
      <div className="ambient-glow opacity-50" aria-hidden />
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            studio · staging.png
          </span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border">
          <div className="relative aspect-[4/3] bg-muted">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-90"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80')",
              }}
            />
            <span className="absolute left-2 top-2 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Antes
            </span>
          </div>
          <div className="relative aspect-[4/3] bg-muted">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80')",
              }}
            />
            <span className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary-foreground">
              Después · IA
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-card/60 px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" strokeWidth={2} />
            <span className="font-medium text-foreground">38 s</span>
            <span>· staging modern luxury</span>
          </span>
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600">
            Listo para MLS
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PIPELINE SECTION (kanban mock)
// ============================================================

function PipelineSection({ t }: { t: Copy }) {
  return (
    <section className="relative border-b border-border/60 bg-card/20 px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <SectionHead eyebrow={t.pipeline.eyebrow} title={t.pipeline.title} sub={t.pipeline.sub} />

        <div className="mt-14 overflow-x-auto">
          <div className="grid min-w-[820px] grid-cols-5 gap-3">
            {t.pipeline.stages.map((stage, i) => (
              <KanbanCol key={stage.key} stage={stage} delay={i * 0.06} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function KanbanCol({
  stage,
  delay,
}: {
  stage: { key: string; label: string; count: number; color: string };
  delay: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col rounded-xl border border-border bg-card/60 p-3"
    >
      <div className="flex items-center justify-between border-b border-border/70 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          <span className={stage.color}>{stage.label}</span>
        </span>
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {stage.count}
        </span>
      </div>
      <div className="mt-3 flex-1 space-y-2">
        {Array.from({ length: Math.min(stage.count, 3) }).map((_, i) => (
          <div key={i} className="rounded-md border border-border bg-background p-2.5">
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 shrink-0 rounded-full bg-primary/15 text-[9px] font-semibold leading-5 text-center text-primary">
                {String.fromCharCode(65 + i)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium">
                  {["Casa en Marbella", "Villa en Miami", "Apto Polanco"][i]}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground tabular-nums">
                  ${[850, 320, 180][i]}k
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// PRICING
// ============================================================

function Pricing({ t }: { t: Copy }) {
  return (
    <section id="pricing" className="relative border-b border-border/60 px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <SectionHead eyebrow={t.pricing.eyebrow} title={t.pricing.title} sub={t.pricing.sub} />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.pricing.plans.map((p, i) => (
            <PricingCard
              key={p.name}
              plan={p as { name: string; price: number | "custom"; tag: string; features: readonly string[]; cta: string; featured: boolean }}
              delay={i * 0.07}
            />
          ))}
        </div>
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          {t.pricing.annualNote}
        </p>
      </div>
    </section>
  );
}

function PricingCard({
  plan,
  delay,
}: {
  plan: { name: string; price: number | "custom"; tag: string; features: readonly string[]; cta: string; featured: boolean };
  delay: number;
}) {
  const reduced = useReducedMotion();
  const isCustom = plan.price === "custom";
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "relative flex flex-col rounded-2xl border p-7 transition-all hover:-translate-y-1",
        plan.featured
          ? "border-primary/40 bg-card shadow-[0_0_0_1px] shadow-primary/20"
          : "border-border bg-card/60"
      )}
    >
      {plan.featured && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground hover:bg-primary">
            <Sparkles className="mr-1 h-3 w-3" />
            {plan.tag}
          </Badge>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
          {!plan.featured && (
            <p className="mt-0.5 text-xs text-muted-foreground">{plan.tag}</p>
          )}
        </div>
      </div>
      <div className="mt-6 flex items-baseline gap-1.5">
        {isCustom ? (
          <>
            <span className="text-4xl font-semibold tracking-tight">Custom</span>
          </>
        ) : (
          <>
            <span className="text-5xl font-semibold tracking-tight">
              ${plan.price}
            </span>
            <span className="text-xs text-muted-foreground">USD / mes</span>
          </>
        )}
      </div>
      <ul className="mt-7 flex-1 space-y-2.5 border-t border-border pt-6">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <CheckCircle2
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                plan.featured ? "text-primary" : "text-muted-foreground"
              )}
              strokeWidth={2}
            />
            <span className="text-foreground/90">{f}</span>
          </li>
        ))}
      </ul>
      <Button
        asChild
        size="lg"
        className="mt-8 h-11"
        variant={plan.featured ? "default" : "outline"}
      >
        <Link href={isCustom ? "mailto:ventas@estaila.com?subject=Plan%20Agency" : "/signup"}>
          {plan.cta} <ArrowRight className="ml-1 h-4 w-4" strokeWidth={2} />
        </Link>
      </Button>
    </motion.div>
  );
}

// ============================================================
// TESTIMONIALS
// ============================================================

function Testimonials({ t }: { t: Copy }) {
  return (
    <section className="relative border-b border-border/60 bg-card/20 px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <SectionHead eyebrow={t.testimonials.eyebrow} title={t.testimonials.title} />
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {t.testimonials.items.map((q, i) => (
            <TestimonialCard key={q.name} q={q} delay={i * 0.07} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  q,
  delay,
}: {
  q: { quote: string; name: string; role: string };
  delay: number;
}) {
  const reduced = useReducedMotion();
  const initial = q.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col rounded-xl border border-border bg-card p-6"
    >
      <div className="flex items-center gap-1 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-amber-500" strokeWidth={0} />
        ))}
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
        “{q.quote}”
      </p>
      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {initial}
        </div>
        <div>
          <p className="text-sm font-medium">{q.name}</p>
          <p className="text-[11px] text-muted-foreground">{q.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// FAQ
// ============================================================

function Faq({ t }: { t: Copy }) {
  return (
    <section className="relative border-b border-border/60 px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[820px]">
        <SectionHead eyebrow={t.faq.eyebrow} title={t.faq.title} />
        <div className="mt-12 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card/60">
          {t.faq.items.map((it, i) => (
            <details
              key={i}
              className="group p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left">
                <span className="text-sm font-medium">{it.q}</span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  strokeWidth={1.75}
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {it.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FINAL CTA
// ============================================================

function FinalCta({ t }: { t: Copy }) {
  return (
    <section className="relative overflow-hidden border-b border-border/60 px-5 py-28 md:px-8 md:py-36">
      <div className="ambient-glow" aria-hidden />
      <div className="absolute inset-0 bg-dots opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-[820px] text-center">
        <h2 className="text-[clamp(36px,7vw,76px)] font-semibold leading-[1.05] tracking-[-0.03em]">
          {t.cta.title}{" "}
          <span
            className="italic text-primary"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 500 }}
          >
            {t.cta.titleEm}
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-[48ch] text-base text-muted-foreground md:text-lg">
          {t.cta.sub}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-11 px-6">
            <Link href="/signup">
              {t.cta.primary}
              <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2} />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-6">
            <Link href="#">
              <MessageCircle className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
              {t.cta.secondary}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER
// ============================================================

function Footer({ t }: { t: Copy }) {
  return (
    <footer className="bg-card/30">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-8 px-5 py-14 md:grid-cols-5 md:px-8">
        <div className="col-span-2">
          <Link href="/welcome" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/web-black-estaila.png"
              alt="Estaila"
              className="h-7 w-auto object-contain dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/web-white-estaila.png"
              alt="Estaila"
              className="hidden h-7 w-auto object-contain dark:block"
            />
            <span className="sr-only">
              estaila<span className="text-primary">.</span>
            </span>
          </Link>
          <p className="mt-4 max-w-[28ch] text-sm text-muted-foreground">
            {t.footer.tagline}
          </p>
          <div className="mt-6 flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>

        <FooterCol title={t.footer.product}>
          <a href="#features">{t.nav.features}</a>
          <a href="#studio">{t.nav.studio}</a>
          <a href="#pricing">{t.nav.pricing}</a>
        </FooterCol>
        <FooterCol title={t.footer.company}>
          <a href="#">{t.footer.about}</a>
          <a href="#">{t.footer.blog}</a>
          <a href="#">{t.footer.careers}</a>
        </FooterCol>
        <FooterCol title={t.footer.legal}>
          <a href="#">{t.footer.terms}</a>
          <a href="#">{t.footer.privacy}</a>
          <a href="#">{t.footer.contact}</a>
        </FooterCol>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-5 md:px-8">
          <p className="text-[11px] text-muted-foreground">{t.footer.rights}</p>
          <p className="font-mono text-[10px] text-muted-foreground">v1 · 2026</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5 text-sm [&_a]:text-foreground/80 [&_a]:transition-colors [&_a:hover]:text-foreground">
        {Array.isArray(children) ? children.map((c, i) => <li key={i}>{c}</li>) : <li>{children}</li>}
      </ul>
    </div>
  );
}

// ============================================================
// REPLACES — comparativa vs herramientas
// ============================================================

function Replaces({ t }: { t: Copy }) {
  const r = t.replaces;
  const reduced = useReducedMotion();
  const totalMonthly = r.tools.reduce((sum, x) => sum + x.price, 0);
  const proPrice = 59;
  const savingsAnnual = (totalMonthly - proPrice) * 12;

  return (
    <section
      id="replaces"
      className="relative border-b border-border/60 px-5 py-24 md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="mx-auto max-w-[720px] text-center">
          <Eyebrow>{r.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.025em] md:text-5xl">
            {r.title}{" "}
            <span
              className="italic text-primary"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 500 }}
            >
              {r.titleEm}
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-[56ch] text-base text-muted-foreground md:text-lg">
            {r.sub}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* ANTES */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border bg-card/40 p-6 md:p-8"
          >
            <div className="mb-5 flex items-center justify-between">
              <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-[10px] uppercase tracking-wider text-destructive">
                {r.pillBefore}
              </Badge>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                5 herramientas
              </span>
            </div>
            <ul className="divide-y divide-border">
              {r.tools.map((tool, i) => (
                <motion.li
                  key={tool.name}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive">
                      <XIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{tool.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{tool.useCase}</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-semibold tabular-nums text-foreground/70">
                    ${tool.price}
                    <span className="text-[10px] font-normal text-muted-foreground">/mes</span>
                  </p>
                </motion.li>
              ))}
            </ul>
            <div className="mt-6 flex items-center justify-between border-t border-dashed border-border pt-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {r.totalLabel}
              </p>
              <p className="font-mono text-2xl font-semibold tabular-nums text-destructive">
                ${totalMonthly}
                <span className="text-[11px] font-normal text-muted-foreground">/mes</span>
              </p>
            </div>
          </motion.div>

          {/* DESPUÉS */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8 shadow-[0_0_0_1px] shadow-primary/20"
          >
            <div className="ambient-glow opacity-40" aria-hidden />
            <div>
              <div className="mb-5 flex items-center justify-between">
                <Badge className="bg-primary text-primary-foreground">
                  <Sparkles className="mr-1 h-3 w-3" />
                  {r.pillAfter}
                </Badge>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  1 suscripción
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{r.vsLabel}</p>
              <p className="mt-2 font-mono text-6xl font-semibold tabular-nums">
                ${proPrice}
                <span className="text-sm font-normal text-muted-foreground">/mes</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Plan Pro · todo incluido
              </p>
            </div>

            <div className="relative mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" strokeWidth={2.25} />
                <p className="text-[11px] font-semibold uppercase tracking-wider">
                  {r.savingsLabel}
                </p>
              </div>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                ${savingsAnnual.toLocaleString("en-US")}
              </p>
            </div>

            <Button asChild size="lg" className="mt-6 h-11">
              <Link href="/signup">
                {t.hero.ctaPrimary}
                <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2} />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// ROI CALCULATOR — slider interactivo
// ============================================================

function RoiCalculator({ t }: { t: Copy }) {
  const r = t.roi;
  const [props, setProps] = useState(5);

  // Lógica: tools fijos (HubSpot+Canva+PS+VS) = 172, fotógrafo variable $60/prop, estaila $59
  const fixedTools = 45 + 15 + 23 + 89;
  const photographerPerProp = 60;
  const proPrice = 59;
  const monthlyExternal = fixedTools + photographerPerProp * props;
  const monthlySavings = monthlyExternal - proPrice;
  const annualSavings = monthlySavings * 12;
  const hoursPerWeek = Math.round(props * 0.8);

  return (
    <section
      id="roi"
      className="relative border-b border-border/60 bg-card/20 px-5 py-24 md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-[1080px]">
        <SectionHead eyebrow={r.eyebrow} title={r.title} sub={r.sub} />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr] lg:items-stretch">
          {/* Slider control */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 md:p-8">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calculator className="h-4 w-4" strokeWidth={1.75} />
                <p className="text-[11px] font-semibold uppercase tracking-wider">
                  {r.sliderLabel}
                </p>
              </div>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-mono text-7xl font-semibold tabular-nums leading-none">
                  {props}
                </span>
                <span className="text-sm text-muted-foreground">/ mes</span>
              </div>
              <div className="mt-8">
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={props}
                  onChange={(e) => setProps(parseInt(e.target.value, 10))}
                  aria-label={r.sliderLabel}
                  className="w-full cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                      ((props - 1) / 19) * 100
                    }%, hsl(var(--border)) ${((props - 1) / 19) * 100}%, hsl(var(--border)) 100%)`,
                    height: 6,
                    borderRadius: 999,
                    appearance: "none",
                  }}
                />
                <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>1</span>
                  <span>10</span>
                  <span>20+</span>
                </div>
              </div>
            </div>
            <p className="mt-8 text-[11px] text-muted-foreground">{r.note}</p>
          </div>

          {/* Resultados */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <ResultTile
              label={r.pieces[0].label}
              value={`$${monthlySavings.toLocaleString("en-US")}`}
              suffix={r.pieces[0].suffix}
              accent="primary"
              icon={Wallet}
            />
            <ResultTile
              label={r.pieces[1].label}
              value={`$${annualSavings.toLocaleString("en-US")}`}
              suffix={r.pieces[1].suffix}
              accent="success"
              icon={TrendingUp}
              big
            />
            <ResultTile
              label={r.pieces[2].label}
              value={`${hoursPerWeek}`}
              suffix={r.pieces[2].suffix}
              accent="muted"
              icon={Calendar}
            />
            <div className="sm:col-span-3 lg:col-span-1">
              <Button asChild size="lg" className="mt-2 h-11 w-full">
                <Link href="/signup">
                  {r.cta}
                  <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultTile({
  label,
  value,
  suffix,
  accent,
  icon: Icon,
  big = false,
}: {
  label: string;
  value: string;
  suffix: string;
  accent: "primary" | "success" | "muted";
  icon: LucideIcon;
  big?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      key={value}
      initial={reduced ? false : { opacity: 0.6, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border p-5",
        accent === "success" && "border-emerald-500/30 bg-emerald-500/[0.06]",
        accent === "primary" && "border-primary/30 bg-primary/[0.06]",
        accent === "muted" && "border-border bg-card"
      )}
    >
      <div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          <p className="text-[10px] font-semibold uppercase tracking-wider">{label}</p>
        </div>
        <p
          className={cn(
            "mt-2 font-mono font-semibold tabular-nums leading-none",
            big ? "text-4xl md:text-5xl" : "text-3xl",
            accent === "success" && "text-emerald-600 dark:text-emerald-400",
            accent === "primary" && "text-primary"
          )}
        >
          {value}
          <span className="ml-1 text-[11px] font-normal text-muted-foreground">{suffix}</span>
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================
// DEMO SLIDER — before/after interactivo
// ============================================================

const DEMO_PAIRS = [
  {
    before: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80",
    after: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
  },
  {
    before: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80",
    after: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80",
  },
  {
    before: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80",
    after: "https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=900&q=80",
  },
];

function DemoSlider({ t }: { t: Copy }) {
  const d = t.demo;
  const [active, setActive] = useState(0);

  return (
    <section
      id="demo"
      className="relative border-b border-border/60 bg-card/20 px-5 py-24 md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="mx-auto max-w-[720px] text-center">
          <Eyebrow>{d.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.025em] md:text-5xl">
            {d.title}{" "}
            <span
              className="italic text-primary"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontWeight: 500 }}
            >
              {d.titleEm}
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-[56ch] text-base text-muted-foreground md:text-lg">
            {d.sub}
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {d.examples.map((ex, i) => (
            <button
              key={ex.label}
              onClick={() => setActive(i)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all",
                active === i
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-border hover:bg-card/80 hover:text-foreground"
              )}
            >
              <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
              {ex.label}
              <span className="font-mono text-[10px] text-primary">· {ex.time}</span>
            </button>
          ))}
        </div>

        <div className="mt-10">
          <BeforeAfterCanvas
            before={DEMO_PAIRS[active].before}
            after={DEMO_PAIRS[active].after}
            hint={d.hint}
            label={d.examples[active].label}
          />
        </div>
      </div>
    </section>
  );
}

function BeforeAfterCanvas({
  before,
  after,
  hint,
  label,
}: {
  before: string;
  after: string;
  hint: string;
  label: string;
}) {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  function updateFromClientX(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPos(pct);
  }

  return (
    <div className="relative">
      <div className="ambient-glow pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <div
        ref={containerRef}
        className="relative aspect-[16/9] w-full select-none overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setDragging(true);
          updateFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          updateFromClientX(e.clientX);
        }}
        onPointerUp={(e) => {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
          setDragging(false);
        }}
        onPointerCancel={() => setDragging(false)}
      >
        {/* AFTER full underlay */}
        <img
          src={after}
          alt={`Después · ${label}`}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
        {/* BEFORE clipped */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img
            src={before}
            alt={`Antes · ${label}`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            draggable={false}
          />
        </div>

        {/* Labels */}
        <span className="absolute left-4 top-4 rounded bg-background/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground backdrop-blur">
          Antes
        </span>
        <span className="absolute right-4 top-4 rounded bg-primary px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary-foreground">
          Después · IA
        </span>

        {/* Divider line */}
        <div
          className="absolute inset-y-0 z-10 w-px bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
        />
        {/* Handle */}
        <button
          type="button"
          aria-label="Arrastrar para comparar"
          className={cn(
            "absolute top-1/2 z-20 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-background/95 shadow-xl backdrop-blur transition-transform",
            dragging && "cursor-grabbing scale-110"
          )}
          style={{ left: `${pos}%` }}
        >
          <MoveHorizontal className="h-5 w-5 text-foreground" strokeWidth={2} />
        </button>

        {/* Hint */}
        {!dragging && (
          <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground backdrop-blur">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CASE STUDIES — agencies
// ============================================================

function CaseStudies({ t }: { t: Copy }) {
  const c = t.cases;
  const reduced = useReducedMotion();
  return (
    <section
      id="cases"
      className="relative border-b border-border/60 px-5 py-24 md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-[1180px]">
        <SectionHead eyebrow={c.eyebrow} title={c.title} sub={c.sub} />

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {c.items.map((item, i) => (
            <motion.article
              key={item.agency}
              initial={reduced ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30 md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Caso de estudio
                    </p>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                    {item.agency}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" strokeWidth={1.75} />
                      {item.location}
                    </span>
                    <span className="h-3 w-px bg-border" />
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3 w-3" strokeWidth={1.75} />
                      {item.team}
                    </span>
                  </div>
                </div>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                  strokeWidth={1.75}
                />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {item.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-lg border border-border bg-background/40 p-3"
                  >
                    <p className="font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground md:text-2xl">
                      {m.value}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>

              <blockquote className="mt-6 border-l-2 border-primary/40 pl-4 text-sm leading-relaxed text-foreground/90 md:text-base">
                "{item.quote}"
              </blockquote>
              <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                — {item.author}
              </p>
            </motion.article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg" variant="outline" className="h-11 px-6">
            <Link href="mailto:ventas@estaila.com?subject=Plan%20Agency">
              <MessageCircle className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
              {c.cta}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SHARED ATOMS
// ============================================================

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
