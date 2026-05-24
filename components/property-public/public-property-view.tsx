"use client";

import {
  ArrowRight,
  Bath,
  Bed,
  Building2,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Maximize2,
  Phone,
  Send,
} from "lucide-react";
import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { submitPublicLead } from "@/lib/actions/lead";
import { cn, initials } from "@/lib/utils";

// Lazy-load Mapbox map (browser-only)
const PropertyMap = dynamic(
  () =>
    import("@/components/properties/map/property-map").then((m) => m.PropertyMap),
  { ssr: false }
);

type POI = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  lat: number;
  lng: number;
  distanceM: number | null;
  walkMinutes: number | null;
  carMinutes: number | null;
  pinned: boolean;
  color: string | null;
};

export type PublicPropertyData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  operation: string;
  priceUSD: number | null;
  priceDOP: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  metersSquared: number | null;
  location: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  featuredPhoto: string | null;
  photos: string[];
  pois: POI[];
};

export type PublicAgent = {
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  role: string | null;
  avatar: string | null;
};

const OP_LABEL: Record<string, string> = {
  EN_VENTA: "En venta",
  EN_ALQUILER: "En alquiler",
  VENDIDA: "Vendida",
  ALQUILADA: "Alquilada",
  CONSIGNACION: "En consignación",
};

const CAT_LABEL: Record<string, string> = {
  CASA: "Casa",
  APARTAMENTO: "Apartamento",
  VILLA: "Villa",
  TERRENO: "Terreno",
  LOCAL: "Local comercial",
  LOCAL_COMERCIAL: "Local comercial",
  OFICINA: "Oficina",
  EDIFICIO: "Edificio",
  SOLAR: "Solar",
};

function formatPrice(amount: number | null, currency: "USD" | "DOP") {
  if (amount == null) return "Consultar precio";
  return `${currency === "USD" ? "US$" : "RD$"}${amount.toLocaleString(
    "en-US",
    { maximumFractionDigits: 0 }
  )}`;
}

export function PublicPropertyView({
  property,
  agent,
  trackingRef,
}: {
  property: PublicPropertyData;
  agent: PublicAgent;
  trackingRef: string | null;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = property.photos.length > 0 ? property.photos : [];

  function scrollToLead() {
    document
      .getElementById("contact-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function nextPhoto() {
    setPhotoIdx((i) => (i + 1) % photos.length);
  }
  function prevPhoto() {
    setPhotoIdx((i) => (i - 1 + photos.length) % photos.length);
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* ======================== HERO ======================== */}
      <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden bg-secondary">
        {photos[photoIdx] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[photoIdx]}
            alt={property.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
            <Building2 className="h-20 w-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

        {/* Photo navigation arrows */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevPhoto}
              aria-label="Foto anterior"
              className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={nextPhoto}
              aria-label="Foto siguiente"
              className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPhotoIdx(i)}
                  aria-label={`Foto ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === photoIdx ? "w-8 bg-white" : "w-1.5 bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Hero text overlay */}
        <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-6xl px-6 pb-10 text-white sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur-md">
                {OP_LABEL[property.operation] ?? property.operation}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur-md">
                {CAT_LABEL[property.category] ?? property.category}
              </span>
            </div>
            <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              {property.title}
            </h1>
            <p className="mt-3 flex items-center gap-1.5 text-base text-white/85">
              <MapPin className="h-4 w-4" strokeWidth={1.75} />
              {property.location ?? property.address ?? "Ubicación reservada"}
            </p>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <p className="font-mono text-3xl font-bold tabular-nums sm:text-4xl">
                {formatPrice(property.priceUSD, "USD")}
              </p>
              <Button
                size="lg"
                onClick={scrollToLead}
                className="rounded-full bg-white text-black hover:bg-white/90"
              >
                Solicitar visita
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======================== SPECS ROW ======================== */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border sm:grid-cols-4">
          <SpecTile
            icon={<Bed className="h-4 w-4" />}
            label="Habitaciones"
            value={property.bedrooms?.toString() ?? "—"}
          />
          <SpecTile
            icon={<Bath className="h-4 w-4" />}
            label="Baños"
            value={property.bathrooms?.toString() ?? "—"}
          />
          <SpecTile
            icon={<Car className="h-4 w-4" />}
            label="Parqueos"
            value={property.parking?.toString() ?? "—"}
          />
          <SpecTile
            icon={<Maximize2 className="h-4 w-4" />}
            label="Metros²"
            value={
              property.metersSquared != null
                ? `${property.metersSquared} m²`
                : "—"
            }
          />
        </div>
      </section>

      {/* ======================== DETAILS + GALLERY ======================== */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-12">
            {/* Description */}
            {property.description && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Sobre esta propiedad
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                  Descripción
                </h2>
                <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground/85">
                  {property.description}
                </p>
              </div>
            )}

            {/* Photo grid */}
            {photos.length > 1 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Galería
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                  {photos.length} fotos de la propiedad
                </h2>
                <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-3">
                  {photos.map((url, i) => (
                    <button
                      type="button"
                      key={url + i}
                      onClick={() => setPhotoIdx(i)}
                      className="group aspect-[4/3] overflow-hidden rounded-xl border border-border bg-secondary"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Foto ${i + 1}`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Map + POIs */}
            {property.lat != null && property.lng != null && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Ubicación
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                  {property.location ?? "En el mapa"}
                </h2>
                {property.pois.filter((p) => p.pinned).length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {property.pois
                      .filter((p) => p.pinned)
                      .map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: p.color ?? "var(--primary)",
                            }}
                          />
                          {p.name}
                          {p.distanceM != null && (
                            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                              ·{" "}
                              {p.distanceM < 1000
                                ? `${p.distanceM}m`
                                : `${(p.distanceM / 1000).toFixed(1)}km`}
                            </span>
                          )}
                        </span>
                      ))}
                  </div>
                )}
                <div className="mt-6">
                  <PropertyMap
                    property={{
                      id: property.id,
                      title: property.title,
                      location: property.location,
                      lat: property.lat,
                      lng: property.lng,
                    }}
                    pois={property.pois}
                    variant="full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sticky agent + actions */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 ring-2 ring-border">
                  <AvatarImage src={agent.avatar ?? undefined} />
                  <AvatarFallback className="bg-primary/15 text-base font-semibold text-primary">
                    {initials(agent.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-base font-semibold tracking-tight">
                    {agent.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {agent.role ?? "Asesor inmobiliario"}
                  </p>
                  {agent.location && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5" />
                      {agent.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {agent.phone && (
                  <a
                    href={`https://wa.me/${agent.phone.replace(/[^\d+]/g, "").replace(/^\+/, "")}?text=${encodeURIComponent(
                      `Hola ${agent.name.split(" ")[0]}, vi tu propiedad "${property.title}" y me interesa.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
                {agent.email && (
                  <a
                    href={`mailto:${agent.email}?subject=${encodeURIComponent(`Interés en ${property.title}`)}`}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary/50"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}
                <Button
                  onClick={scrollToLead}
                  className="w-full"
                  variant="ink"
                  size="lg"
                >
                  Solicitar visita
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ======================== LEAD FORM ======================== */}
      <section
        id="contact-form"
        className="border-y border-border bg-secondary/30 py-16"
      >
        <div className="mx-auto max-w-3xl px-6 sm:px-8">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Solicita información
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              ¿Te interesa esta propiedad?
            </h2>
            <p className="mt-3 max-w-prose text-sm text-muted-foreground sm:text-base">
              Déjanos tu contacto y te llamamos para coordinar una visita o
              enviarte más información.
            </p>
          </div>
          <LeadForm slug={property.slug} trackingRef={trackingRef} />
        </div>
      </section>

      {/* ======================== FOOTER ======================== */}
      <footer className="bg-card py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 text-center sm:px-8">
          <p className="text-sm font-semibold tracking-tight">
            estaila<span className="text-primary">.</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Propiedad publicada por {agent.name} · Compartido vía estaila CRM
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// SPEC TILE
// ============================================================

function SpecTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card px-6 py-5">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// LEAD FORM
// ============================================================

function LeadForm({
  slug,
  trackingRef,
}: {
  slug: string;
  trackingRef: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // bot trap
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Por favor escribe tu nombre");
      return;
    }
    if (!whatsapp.trim() && !email.trim()) {
      toast.error("Necesitamos WhatsApp o email para contactarte");
      return;
    }
    startTransition(async () => {
      try {
        await submitPublicLead({
          slug,
          name: name.trim(),
          whatsapp: whatsapp.trim() || undefined,
          email: email.trim() || undefined,
          message: message.trim() || undefined,
          trackingId: trackingRef ?? undefined,
          honeypot,
        });
        setDone(true);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
          <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
        </span>
        <h3 className="text-2xl font-semibold tracking-tight">
          ¡Gracias por tu interés!
        </h3>
        <p className="max-w-prose text-sm text-muted-foreground">
          Recibimos tu mensaje. Te contactaremos en breve por el canal que
          dejaste.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      {/* Honeypot — invisible to humans, bots fill it */}
      <input
        type="text"
        name="website_url"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="sr-only"
        aria-hidden
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tu nombre *" className="sm:col-span-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="María Rodríguez"
            required
            maxLength={120}
          />
        </Field>
        <Field label="WhatsApp / Teléfono">
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+1 555 0100"
            type="tel"
          />
        </Field>
        <Field label="Email">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            type="email"
          />
        </Field>
        <Field label="Mensaje (opcional)" className="sm:col-span-2">
          <Textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuándo te gustaría visitar, qué necesitas saber..."
          />
        </Field>
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          No compartimos tu información. Solo para contactarte sobre esta
          propiedad.
        </p>
        <Button type="submit" disabled={pending} variant="ink" size="lg">
          {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          <Send className="mr-1.5 h-4 w-4" />
          Enviar
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
