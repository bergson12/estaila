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

export function SiteSettingsClient({
  initial,
  defaultUserName,
}: {
  initial: Initial | null;
  defaultUserName: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [form, setForm] = useState<Initial>(
    initial ?? ({
      slug: "",
      template: "DEFAULT",
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

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = form.slug ? `${baseUrl}/p/${form.slug}` : null;

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
      toast.success(
        r.published ? "🌐 Sitio publicado" : "🔒 Sitio despublicado"
      );
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

  return (
    <div className="space-y-6">
      {/* Public URL bar */}
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

      {/* === CUSTOMIZATION (Premium) — Font / Language / Sections === */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-gradient-to-r from-primary/5 to-transparent px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Premium
            </span>
            <h2 className="text-sm font-semibold">Personalización</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Tipografía, idioma y secciones visibles. Diferencia tu portal del resto.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
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
                    {/* Live text sample */}
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
                        style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
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
                    <span className="text-2xl">{l.flag}</span>
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
        <div className="border-t border-border bg-card/30 p-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Secciones visibles en landing
          </p>
          <p className="mb-4 text-[11px] text-muted-foreground">
            Aplica a todas las propiedades. Desactiva las que no tengas datos completos.
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* URL + identidad */}
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold">URL e identidad</h2>
          <div className="space-y-4">
            <Field label="URL del sitio">
              <div className="flex items-stretch gap-1.5">
                <div className="flex items-center rounded-md border border-border bg-muted px-3 text-xs text-muted-foreground">
                  /p/
                </div>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    set("slug", e.target.value.toLowerCase().replace(/\s/g, "-"))
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
              <p className="mt-1 text-xs text-muted-foreground">
                Solo letras, números y guiones. No espacios.
              </p>
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
                      form.primaryColor === c
                        ? "ring-foreground"
                        : "ring-transparent"
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

        {/* Contacto + Social */}
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold">Contacto y redes</h2>
          <div className="space-y-4">
            <Field label="Teléfono">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+00 000-000-0000"
                className="font-mono tabular-nums"
              />
            </Field>
            <Field label="WhatsApp">
              <Input
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="+00 000-000-0000"
                className="font-mono tabular-nums"
              />
            </Field>
            <Field label="Email público">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contacto@..."
              />
            </Field>
            <Field label="Instagram URL">
              <Input
                value={form.instagramUrl}
                onChange={(e) => set("instagramUrl", e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </Field>
            <Field label="Facebook URL">
              <Input
                value={form.facebookUrl}
                onChange={(e) => set("facebookUrl", e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </Field>
            <Field label="TikTok URL">
              <Input
                value={form.tiktokUrl}
                onChange={(e) => set("tiktokUrl", e.target.value)}
                placeholder="https://tiktok.com/@..."
              />
            </Field>
          </div>
        </Card>
      </div>

      {/* Branding (optional images) */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold">Branding</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Logo URL">
            <Input
              value={form.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
              placeholder="/uploads/... o URL externa"
            />
          </Field>
          <Field label="Cover URL (hero background)">
            <Input
              value={form.coverUrl}
              onChange={(e) => set("coverUrl", e.target.value)}
              placeholder="/uploads/... o URL externa"
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Tip: usa URLs absolutas o sube las imágenes desde Studio IA primero.
        </p>
      </Card>

      {/* Bottom save bar */}
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
