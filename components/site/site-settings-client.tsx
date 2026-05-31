"use client";

import {
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  Loader2,
  CheckCircle2,
  Lock,
  Globe,
  Sparkles,
  AlertCircle,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/compress-image";
import { saveSite, suggestSlug, togglePublished } from "@/lib/actions/site";

type Initial = {
  slug: string;
  template: string;
  title: string;
  tagline: string;
  about: string;
  primaryColor: string;
  logoUrl: string;
  coverUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  published: boolean;
  // Customization
  fontPair: string;
  language: string;
  enabledSections: string[];
};

export const FONT_PAIRS = [
  {
    value: "ELEGANT",
    label: "Elegante",
    description: "Cormorant Garamond + Inter",
    sample: "Aa",
    style: { fontFamily: "var(--font-cormorant), serif" },
  },
  {
    value: "EDITORIAL",
    label: "Editorial",
    description: "Playfair Display + Inter",
    sample: "Aa",
    style: { fontFamily: "var(--font-playfair), serif" },
  },
  {
    value: "MODERN",
    label: "Moderno",
    description: "Inter sans-serif minimal",
    sample: "Aa",
    style: { fontFamily: "var(--font-inter), sans-serif", fontWeight: 600 },
  },
  {
    value: "MINIMAL",
    label: "Minimal",
    description: "Inter ligero + tracking amplio",
    sample: "Aa",
    style: {
      fontFamily: "var(--font-inter), sans-serif",
      fontWeight: 300,
      letterSpacing: "0.03em",
    },
  },
] as const;

export const LANGUAGES = [
  { value: "es", label: "Español", flag: "🌐" },
  { value: "en", label: "English", flag: "🌐" },
] as const;

/** Plantillas del portal público. El render por plantilla ya vive en /p/[slug]. */
const TEMPLATES = [
  {
    value: "LUXURY_DARK",
    label: "Luxury Dark",
    description: "Editorial y sofisticado sobre fondo oscuro. Para propiedades premium.",
    swatch: "linear-gradient(135deg,#18181b,#3f3f46)",
    dot: "#C9A227",
  },
  {
    value: "TROPICAL_BRIGHT",
    label: "Tropical",
    description: "Cálido y luminoso, colores caribeños. Ideal playa / RD.",
    swatch: "linear-gradient(135deg,#0EA5A4,#FBBF24)",
    dot: "#0EA5A4",
  },
  {
    value: "MINIMAL_CLASSIC",
    label: "Minimal",
    description: "Limpio y neutro, tipo Notion / Linear. Profesional sobrio.",
    swatch: "linear-gradient(135deg,#e4e4e7,#ffffff)",
    dot: "#111827",
  },
  {
    value: "MODERN_BOLD",
    label: "Bold",
    description: "Dinámico, contrastes fuertes, orientado a conversión.",
    swatch: "linear-gradient(135deg,#7C3AED,#EC4899)",
    dot: "#7C3AED",
  },
] as const;

const TABS = [
  { id: "general", label: "General" },
  { id: "plantilla", label: "Plantilla" },
  { id: "branding", label: "Branding" },
  { id: "contacto", label: "Contacto" },
  { id: "seo", label: "SEO" },
] as const;

const TOGGLEABLE_SECTIONS = [
  { key: "AMENITIES", label: "Amenidades", description: "Sección hotel boutique con servicios" },
  { key: "FLOOR_PLANS", label: "Planos / Distribución", description: "Tipos de unidad disponibles" },
  { key: "NEIGHBORHOOD", label: "Vecindario + Mapa", description: "POIs cercanos con Mapbox" },
  { key: "IMMERSIVE", label: "Sección inmersiva", description: "Parallax cinematográfico" },
  { key: "FINISHES", label: "Acabados", description: "Lista de materiales premium" },
] as const;

const COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#0D9488", // teal
];

// Validez del slug (mismas reglas que el server: 3-40, sin guion al inicio/fin).
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

export function SiteSettingsClient({
  initial,
  defaultUserName,
}: {
  initial: Initial | null;
  defaultUserName: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("general");
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [form, setForm] = useState<Initial>(
    initial ??
      ({
        slug: "",
        template: "LUXURY_DARK",
        title: defaultUserName,
        tagline: "",
        about: "",
        primaryColor: "#3B82F6",
        logoUrl: "",
        coverUrl: "",
        phone: "",
        whatsapp: "",
        email: "",
        facebookUrl: "",
        instagramUrl: "",
        tiktokUrl: "",
        published: false,
        fontPair: "ELEGANT",
        language: "es",
        enabledSections: [
          "AMENITIES",
          "FLOOR_PLANS",
          "NEIGHBORHOOD",
          "IMMERSIVE",
          "FINISHES",
        ],
      } as Initial)
  );

  function toggleSection(key: string) {
    set(
      "enabledSections",
      form.enabledSections.includes(key)
        ? form.enabledSections.filter((s) => s !== key)
        : [...form.enabledSections, key]
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const baseHost = baseUrl.replace(/^https?:\/\//, "") || "estaila.com";
  const publicUrl = form.slug ? `${baseUrl}/p/${form.slug}` : null;
  const slugValid = SLUG_RE.test(form.slug);

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function autoSuggestSlug() {
    const slug = await suggestSlug(form.title || defaultUserName);
    set("slug", slug);
  }

  async function onSave() {
    if (!form.slug.trim()) {
      toast.error("Necesitas una URL — usa el botón sugerir");
      setTab("general");
      return;
    }
    setSubmitting(true);
    try {
      await saveSite(form);
      toast.success("Sitio guardado");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onTogglePublish() {
    setPublishing(true);
    try {
      const r = await togglePublished();
      set("published", r.published);
      toast.success(r.published ? "Sitio publicado" : "Sitio despublicado");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPublishing(false);
    }
  }

  function copyUrl() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    toast.success("URL copiada");
  }

  async function uploadImageField(
    file: File,
    key: "logoUrl" | "coverUrl",
    setUploading: (b: boolean) => void
  ) {
    setUploading(true);
    try {
      const compressed = await compressImage(file, "default");
      const fd = new FormData();
      fd.append("file", compressed);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir");
      set(key, data.url as string);
      toast.success("Imagen subida");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Public URL bar — siempre visible */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              form.published
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-muted text-muted-foreground"
            )}
          >
            {form.published ? (
              <Globe className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {form.published ? "Publicado · visible para todos" : "Privado"}
            </p>
            <p className="mt-0.5 truncate font-mono text-sm tabular-nums">
              {publicUrl ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {publicUrl && (
            <>
              <Button variant="outline" size="sm" onClick={copyUrl}>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copiar
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={publicUrl} target="_blank">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Abrir
                </Link>
              </Button>
            </>
          )}
          {initial && (
            <Button
              variant={form.published ? "outline" : "default"}
              size="sm"
              onClick={onTogglePublish}
              disabled={publishing}
            >
              {publishing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : form.published ? (
                <EyeOff className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <Eye className="mr-1.5 h-3.5 w-3.5" />
              )}
              {form.published ? "Despublicar" : "Publicar"}
            </Button>
          )}
        </div>
      </Card>

      {/* Tab nav */}
      <div className="hide-scrollbar -mx-1 flex items-center gap-0.5 overflow-x-auto border-b border-border px-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative shrink-0 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
              )}
            >
              {t.label}
              {active && (
                <motion.span
                  layoutId="site-tab-underline"
                  className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ===================== GENERAL ===================== */}
      {tab === "general" && (
        <Card className="p-6">
          <div className="space-y-4">
            <Field label="URL del sitio">
              <div className="flex items-stretch gap-1.5">
                <div className="flex items-center rounded-md border border-border bg-muted px-3 text-xs text-muted-foreground">
                  {baseHost}/p/
                </div>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    set(
                      "slug",
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                    )
                  }
                  placeholder="tu-nombre"
                  className="flex-1 font-mono tabular-nums"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={autoSuggestSlug}
                >
                  Sugerir
                </Button>
              </div>
              {/* Preview de la URL con validación */}
              {form.slug ? (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs tabular-nums">
                    {baseHost}/p/{form.slug}
                  </span>
                  {slugValid ? (
                    <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Válida
                    </span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-3.5 w-3.5" /> 3-40, sin guion al
                      borde
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Solo letras, números y guiones. No espacios.
                </p>
              )}
            </Field>

            <Field label="Nombre / Título">
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Tu nombre o marca"
              />
            </Field>

            <Field label="Tagline (hero)">
              <Input
                value={form.tagline}
                onChange={(e) => set("tagline", e.target.value)}
                placeholder="Ej: Tu próximo hogar te está esperando"
              />
            </Field>

            <Field label="Sobre ti / bio">
              <Textarea
                value={form.about}
                onChange={(e) => set("about", e.target.value)}
                rows={4}
                placeholder="Cuéntale a tus visitantes quién eres y por qué confiarte sus inmuebles."
              />
            </Field>

            <Field label="Color de marca">
              <div className="flex flex-wrap items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("primaryColor", c)}
                    className={cn(
                      "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-110",
                      form.primaryColor === c ? "ring-foreground" : "ring-transparent"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
                <Input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  placeholder="#3B82F6"
                  className="ml-1 max-w-[120px] font-mono text-xs tabular-nums"
                />
              </div>
            </Field>
          </div>
        </Card>
      )}

      {/* ===================== PLANTILLA ===================== */}
      {tab === "plantilla" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-sm font-semibold">Plantilla del portal</h2>
            <p className="mb-4 mt-1 text-xs text-muted-foreground">
              Define la estructura y el estilo de tu sitio público. Cámbiala
              cuando quieras.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TEMPLATES.map((t) => {
                const active = form.template === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set("template", t.value)}
                    className={cn(
                      "group overflow-hidden rounded-xl border text-left transition-all",
                      active
                        ? "border-primary/50 ring-1 ring-primary/30"
                        : "border-border hover:border-foreground/20 hover:shadow-sm"
                    )}
                  >
                    {/* Mini preview del estilo */}
                    <div
                      className="relative h-24 w-full"
                      style={{ background: t.swatch }}
                    >
                      <div className="absolute inset-0 flex flex-col justify-end p-3">
                        <div
                          className="h-1.5 w-16 rounded-full"
                          style={{ backgroundColor: t.dot }}
                        />
                        <div className="mt-1.5 h-2 w-24 rounded-full bg-white/70" />
                        <div className="mt-1 h-2 w-14 rounded-full bg-white/40" />
                      </div>
                      {active && (
                        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          active && "text-primary"
                        )}
                      >
                        {t.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        {t.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Personalización: tipografía + idioma + secciones */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Premium
              </span>
              <h2 className="text-sm font-semibold">Personalización</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Font pair */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tipografía
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {FONT_PAIRS.map((f) => {
                    const active = form.fontPair === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => set("fontPair", f.value)}
                        className={cn(
                          "group relative overflow-hidden rounded-lg border text-left transition-all",
                          active
                            ? "border-primary/50 bg-card ring-1 ring-primary/30"
                            : "border-border bg-card hover:border-foreground/20 hover:shadow-sm"
                        )}
                      >
                        <div className="border-b border-border bg-muted/30 p-3">
                          <p
                            className="text-xs leading-tight text-muted-foreground"
                            style={
                              f.value === "EDITORIAL" || f.value === "ELEGANT"
                                ? { fontFamily: "var(--font-inter), sans-serif" }
                                : {
                                    fontFamily: "var(--font-inter), sans-serif",
                                    letterSpacing:
                                      f.value === "MINIMAL" ? "0.03em" : undefined,
                                  }
                            }
                          >
                            En venta · Casa
                          </p>
                          <p
                            className={cn(
                              "mt-1 leading-[1] tracking-tight",
                              f.value === "MODERN" && "font-bold",
                              f.value === "MINIMAL" && "font-light"
                            )}
                            style={{
                              ...(f.style as React.CSSProperties),
                              fontSize: "22px",
                            }}
                          >
                            {f.value === "EDITORIAL" || f.value === "ELEGANT" ? (
                              <>
                                Casa <em className="italic">Miraflores</em>
                              </>
                            ) : f.value === "MODERN" ? (
                              <span className="uppercase">Casa Miraflores</span>
                            ) : (
                              "Casa Miraflores"
                            )}
                          </p>
                          <p
                            className="mt-1.5 font-mono text-[10px] tabular-nums text-muted-foreground"
                            style={{
                              fontFamily: "var(--font-jetbrains-mono), monospace",
                            }}
                          >
                            US$ 1,000,000
                          </p>
                        </div>
                        <div className="flex items-center justify-between p-3">
                          <div>
                            <p
                              className={cn(
                                "text-xs font-semibold",
                                active && "text-primary"
                              )}
                            >
                              {f.label}
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              {f.description}
                            </p>
                          </div>
                          {active && (
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Idioma del portal
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map((l) => {
                    const active = form.language === l.value;
                    return (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => set("language", l.value)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 transition-all",
                          active
                            ? "border-primary/40 bg-primary/5 ring-1 ring-primary/30"
                            : "border-border bg-card hover:border-foreground/20"
                        )}
                      >
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            active ? "text-primary" : ""
                          )}
                        >
                          {l.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Cambia los textos del portal público. El CRM siempre en español.
                </p>
              </div>
            </div>

            {/* Section toggles */}
            <div className="mt-6 border-t border-border pt-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Secciones visibles en landing
              </p>
              <p className="mb-4 text-[11px] text-muted-foreground">
                Aplica a todas las propiedades. Desactiva las que no tengas datos
                completos.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {TOGGLEABLE_SECTIONS.map((s) => {
                  const active = form.enabledSections.includes(s.key);
                  return (
                    <label
                      key={s.key}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all",
                        active
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-card hover:border-foreground/20"
                      )}
                    >
                      <Switch
                        checked={active}
                        onCheckedChange={() => toggleSection(s.key)}
                      />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-xs font-semibold",
                            active && "text-primary"
                          )}
                        >
                          {s.label}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                          {s.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===================== BRANDING ===================== */}
      {tab === "branding" && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold">Branding</h2>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            Tu identidad visual en el portal: logo y portada (hero).
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Logo">
              <div className="flex items-stretch gap-1.5">
                <Input
                  value={form.logoUrl}
                  onChange={(e) => set("logoUrl", e.target.value)}
                  placeholder="https://… o sube una imagen"
                  className="flex-1"
                />
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                >
                  <label className="cursor-pointer">
                    {uploadingLogo ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingLogo}
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        uploadImageField(
                          e.target.files[0],
                          "logoUrl",
                          setUploadingLogo
                        )
                      }
                    />
                  </label>
                </Button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Recomendado: mínimo 400×400px, fondo transparente. SVG o PNG.
              </p>
            </Field>
            <Field label="Portada / Cover">
              <div className="flex items-stretch gap-1.5">
                <Input
                  value={form.coverUrl}
                  onChange={(e) => set("coverUrl", e.target.value)}
                  placeholder="https://… o sube una imagen"
                  className="flex-1"
                />
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={uploadingCover}
                >
                  <label className="cursor-pointer">
                    {uploadingCover ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingCover}
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        uploadImageField(
                          e.target.files[0],
                          "coverUrl",
                          setUploadingCover
                        )
                      }
                    />
                  </label>
                </Button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Recomendado: 1920×600px (16:5). Para redes: 1200×630px.
              </p>
            </Field>
          </div>

          {/* Preview del cover */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vista previa de la portada
            </p>
            <div className="overflow-hidden rounded-xl border border-border">
              <div
                className="flex aspect-[1920/600] w-full items-center justify-center bg-muted bg-cover bg-center"
                style={
                  form.coverUrl
                    ? { backgroundImage: `url(${JSON.stringify(form.coverUrl)})` }
                    : undefined
                }
              >
                {!form.coverUrl && (
                  <span className="text-xs text-muted-foreground">
                    Sin portada
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTA: crear assets con Studio IA */}
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">¿No tienes logo o portada?</p>
              <p className="text-xs text-muted-foreground">
                Créalos en minutos con Studio IA y pega la URL aquí.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/studio">
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Abrir Studio IA
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* ===================== CONTACTO ===================== */}
      {tab === "contacto" && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold">Contacto y redes</h2>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            Cómo te contactan los visitantes desde el portal.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Teléfono">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 809-000-0000"
                className="font-mono tabular-nums"
              />
            </Field>
            <Field label="WhatsApp">
              <Input
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="+1 809-000-0000"
                className="font-mono tabular-nums"
              />
            </Field>
            <Field label="Email público">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contacto@…"
              />
            </Field>
            <Field label="Instagram (URL)">
              <Input
                value={form.instagramUrl}
                onChange={(e) => set("instagramUrl", e.target.value)}
                placeholder="https://instagram.com/…"
              />
            </Field>
            <Field label="Facebook (URL)">
              <Input
                value={form.facebookUrl}
                onChange={(e) => set("facebookUrl", e.target.value)}
                placeholder="https://facebook.com/…"
              />
            </Field>
            <Field label="TikTok (URL)">
              <Input
                value={form.tiktokUrl}
                onChange={(e) => set("tiktokUrl", e.target.value)}
                placeholder="https://tiktok.com/@…"
              />
            </Field>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Más redes (LinkedIn, X, YouTube) llegarán en una próxima actualización.
          </p>
        </Card>
      )}

      {/* ===================== SEO ===================== */}
      {tab === "seo" && (
        <Card className="space-y-6 p-6">
          <div>
            <h2 className="text-sm font-semibold">Vista previa en Google</h2>
            <p className="mb-3 mt-1 text-xs text-muted-foreground">
              Así aparece tu sitio en resultados de búsqueda (se genera de tu
              nombre y tagline).
            </p>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="truncate text-xs text-emerald-600 dark:text-emerald-400">
                {publicUrl ?? `${baseHost}/p/tu-nombre`}
              </p>
              <p className="mt-0.5 text-base text-primary">
                {form.title || "Tu nombre"} · Inmobiliaria
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {form.tagline ||
                  form.about ||
                  "Agrega un tagline o bio para tu descripción en buscadores."}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Vista previa al compartir</h2>
            <p className="mb-3 mt-1 text-xs text-muted-foreground">
              Cómo se ve el enlace en WhatsApp, Instagram y Facebook.
            </p>
            <div className="max-w-md overflow-hidden rounded-xl border border-border">
              <div
                className="flex aspect-[1200/630] w-full items-center justify-center bg-muted bg-cover bg-center"
                style={
                  form.coverUrl
                    ? { backgroundImage: `url(${JSON.stringify(form.coverUrl)})` }
                    : undefined
                }
              >
                {!form.coverUrl && (
                  <span className="text-xs text-muted-foreground">
                    Sin imagen — usa una portada en Branding
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {baseHost}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold">
                  {form.title || "Tu nombre"}
                </p>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {form.tagline || "Tu tagline aparecerá aquí"}
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Pronto: meta título, meta descripción y palabras clave dedicadas
            (sugeridas con IA a partir de tu bio).
          </p>
        </Card>
      )}

      {/* Bottom save bar — siempre visible */}
      <div className="sticky bottom-4 flex items-center justify-end gap-2 rounded-xl border border-border bg-card/80 p-3 backdrop-blur-md">
        <span className="mr-auto text-xs text-muted-foreground">
          {initial ? "Editando sitio existente" : "Creando tu sitio"}
        </span>
        <Button onClick={onSave} disabled={submitting} size="lg">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
