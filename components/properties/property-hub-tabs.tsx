"use client";

import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Hash,
  Home,
  ImagePlus,
  Info,
  Key,
  Loader2,
  MapPin,
  MousePointer,
  Save,
  Send,
  Settings2,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import {
  generateBioForProperty,
  generateCaptionForProperty,
  generateHashtagsForProperty,
} from "@/lib/ai/marketing-ai";
import { NumberTicker } from "@/components/shared/number-ticker";
import { DocumentDialog } from "@/components/properties/documents/document-dialog";
import { TemplatesManager } from "@/components/properties/documents/templates-manager";
import type { DocKind } from "@/lib/document-templates";
import { RentalTab } from "@/components/properties/rental-tab";
import { MapTab } from "@/components/properties/map/map-tab";
import type { POIData } from "@/components/properties/map/property-map";
import { KitSection } from "@/components/marketing-kit/kit-section";

type PropertyForHub = {
  id: string;
  title: string;
  category: string;
  operation: string;
  featuredPhoto: string | null;
  priceUSD: number | null;
  location: string | null;
  address?: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  metersSquared: number | null;
};

type PropertyAnalytics = {
  views: number;
  shares: number;
  clicks: number;
  leads: number;
};

const ZERO_ANALYTICS: PropertyAnalytics = { views: 0, shares: 0, clicks: 0, leads: 0 };

const TABS: { value: string; label: string; icon: LucideIcon; soon?: boolean; rentalOnly?: boolean }[] = [
  { value: "overview", label: "Vista general", icon: Info },
  { value: "map", label: "Mapa & POIs", icon: MapPin },
  { value: "social", label: "Social Kit", icon: Sparkles },
  { value: "landing", label: "Landing", icon: Home },
  { value: "analytics", label: "Analytics", icon: Activity },
  { value: "documents", label: "Documentos", icon: FileText },
  { value: "rental", label: "Gestión Alquiler", icon: Key, rentalOnly: true },
];

type MarketingKitRow = {
  id: string;
  name: string;
  audience: string | null;
  tone: string | null;
  goal: string | null;
  angle: string | null;
  captions: string;
  hashtags: string;
  bios: string;
  pickedCaption: number | null;
  pickedBio: number | null;
  status: string;
  updatedAt: Date | string;
};

export function PropertyHubTabs({
  property,
  hasSite,
  siteSlug,
  mapProperty,
  pois,
  marketingKits = [],
  analytics = ZERO_ANALYTICS,
  children,
}: {
  property: PropertyForHub;
  hasSite: boolean;
  siteSlug: string | null;
  mapProperty: {
    id: string;
    title: string;
    location: string | null;
    lat: number | null;
    lng: number | null;
  };
  pois: POIData[];
  marketingKits?: MarketingKitRow[];
  analytics?: PropertyAnalytics;
  /** Overview content rendered by parent (existing sections) */
  children: React.ReactNode;
}) {
  const [tab, setTab] = useState("overview");
  const isRental = property.operation === "EN_ALQUILER" || property.operation === "ALQUILADA";
  const visibleTabs = TABS.filter((t) => !t.rentalOnly || isRental);

  return (
    <div>
      {/* Tab nav — compact, no scroll on desktop, icons-only on small screens */}
      <div className="mb-6 sticky top-16 z-10 -mx-6 border-b border-border bg-background/80 px-6 backdrop-blur-xl">
        <div className="hide-scrollbar flex items-center gap-0.5 overflow-x-auto sm:flex-wrap sm:overflow-visible">
          {visibleTabs.map((t) => {
            const active = tab === t.value;
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                title={t.label}
                className={cn(
                  "group relative flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2.5 text-[13px] transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-colors",
                    active ? "text-primary" : ""
                  )}
                  strokeWidth={1.75}
                />
                <span className="hidden font-medium md:inline">{t.label}</span>
                <span className="font-medium md:hidden">
                  {t.label.length > 8 ? t.label.slice(0, 8) : t.label}
                </span>
                {t.soon && (
                  <span className="hidden rounded bg-muted px-1 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground lg:inline">
                    Pronto
                  </span>
                )}
                {active && (
                  <motion.span
                    layoutId="hub-tab-underline"
                    className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {tab === "overview" && children}
          {tab === "map" && <MapTab property={mapProperty} pois={pois} />}
          {tab === "social" && (
            <SocialKitTab
              property={property}
              marketingKits={marketingKits}
            />
          )}
          {tab === "landing" && (
            <LandingTab property={property} hasSite={hasSite} siteSlug={siteSlug} />
          )}
          {tab === "analytics" && <AnalyticsTab analytics={analytics} hasSite={hasSite} />}
          {tab === "documents" && <DocumentsTab property={property} />}
          {tab === "rental" && <RentalTab propertyId={property.id} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// SOCIAL KIT TAB
// ============================================================

const SOCIAL_FORMATS = [
  { value: "1:1", label: "Feed (1:1)", ratio: "aspect-square" },
  { value: "4:5", label: "Vertical (4:5)", ratio: "aspect-[4/5]" },
  { value: "9:16", label: "Stories / Reels (9:16)", ratio: "aspect-[9/16]" },
];

type DesignSettings = {
  showPrice: boolean;
  showTitle: boolean;
  showLocation: boolean;
  showWatermark: boolean;
  brandingText: string;
  overlayPos: "bottom" | "top" | "center";
  textColor: "white" | "dark";
};

function SocialKitTab({
  property,
  marketingKits = [],
}: {
  property: PropertyForHub;
  marketingKits?: MarketingKitRow[];
}) {
  const [format, setFormat] = useState("4:5");
  const [photo, setPhoto] = useState<string | null>(property.featuredPhoto);
  const [uploading, setUploading] = useState(false);
  const [design, setDesign] = useState<DesignSettings>({
    showPrice: true,
    showTitle: true,
    showLocation: true,
    showWatermark: true,
    brandingText: "estaila",
    overlayPos: "bottom",
    textColor: "white",
  });
  const [caption, setCaption] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [bios, setBios] = useState<string[]>([]);
  const [loading, setLoading] = useState<
    "caption" | "hashtags" | "bios" | "kit" | null
  >(null);

  async function gen(kind: "caption" | "hashtags" | "bios") {
    setLoading(kind);
    try {
      if (kind === "caption") {
        const r = await generateCaptionForProperty(property.id);
        setCaption(r.captions);
      } else if (kind === "hashtags") {
        const r = await generateHashtagsForProperty(property.id);
        setHashtags(r.hashtags);
      } else {
        const r = await generateBioForProperty(property.id);
        setBios(r.bios);
      }
      toast.success("Generado con IA");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  /**
   * Mini campaña — runs all 3 AI generators in parallel and surfaces the
   * combined output count. The 4 visual formats (post / story / reel / flyer)
   * are just aspect-ratio variants of the same photo overlay — no extra AI calls.
   */
  async function generateKit() {
    setLoading("kit");
    try {
      const [cap, hash, bio] = await Promise.all([
        generateCaptionForProperty(property.id),
        generateHashtagsForProperty(property.id),
        generateBioForProperty(property.id),
      ]);
      setCaption(cap.captions);
      setHashtags(hash.hashtags);
      setBios(bio.bios);
      toast.success("Kit listo ✨", {
        description: `${cap.captions.length} captions · ${hash.hashtags.length} hashtags · ${bio.bios.length} bios`,
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copiado");
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo imágenes");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir");
      setPhoto(data.url);
      toast.success("Foto cambiada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function resetPhoto() {
    setPhoto(property.featuredPhoto);
    toast.success("Foto restaurada");
  }

  const selectedFormat = SOCIAL_FORMATS.find((f) => f.value === format)!;

  function updateDesign<K extends keyof DesignSettings>(
    key: K,
    val: DesignSettings[K]
  ) {
    setDesign((d) => ({ ...d, [key]: val }));
  }

  const overlayPosClass =
    design.overlayPos === "bottom"
      ? "inset-x-0 bottom-0"
      : design.overlayPos === "top"
        ? "inset-x-0 top-0"
        : "inset-x-0 top-1/2 -translate-y-1/2 text-center";

  const overlayGradient =
    design.overlayPos === "bottom"
      ? "bg-gradient-to-t from-black/85 via-black/40 to-transparent"
      : design.overlayPos === "top"
        ? "bg-gradient-to-b from-black/85 via-black/40 to-transparent"
        : "bg-black/30";

  const textCol = design.textColor === "white" ? "text-white" : "text-stone-900";
  const textColMuted =
    design.textColor === "white" ? "text-white/80" : "text-stone-700";
  const textColDim =
    design.textColor === "white" ? "text-white/60" : "text-stone-600";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
      {/* LEFT: Multi-format preview */}
      <div className="space-y-4">
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Camera className="h-4 w-4 text-primary" />
              Multi-formato
            </h3>
            <div className="flex items-center gap-1">
              {SOCIAL_FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                    format === f.value
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center bg-dots-sm py-8">
            <motion.div
              key={format}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "relative overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-black/10 dark:ring-white/10",
                selectedFormat.ratio,
                format === "9:16" ? "w-56" : format === "4:5" ? "w-72" : "w-72"
              )}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-emerald-500/20">
                  <Camera className="h-12 w-12 text-white/40" />
                </div>
              )}
              {/* Branding overlay */}
              {(design.showPrice ||
                design.showTitle ||
                design.showLocation) && (
                <div
                  className={cn(
                    "absolute p-4",
                    overlayPosClass,
                    overlayGradient
                  )}
                >
                  {design.showPrice && (
                    <p
                      className={cn(
                        "font-mono text-base font-bold tabular-nums",
                        textCol
                      )}
                    >
                      {formatCurrency(property.priceUSD ?? 0)}
                    </p>
                  )}
                  {design.showTitle && (
                    <p className={cn("line-clamp-1 text-xs", textColMuted)}>
                      {property.title}
                    </p>
                  )}
                  {design.showLocation && property.location && (
                    <p
                      className={cn("mt-0.5 line-clamp-1 text-[10px]", textColDim)}
                    >
                      📍 {property.location}
                    </p>
                  )}
                </div>
              )}
              {/* Watermark */}
              {design.showWatermark && (
                <div className="absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                  {design.brandingText}
                </div>
              )}
            </motion.div>
          </div>

          {/* Photo + design actions */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
            <label className="inline-flex cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) =>
                  e.target.files?.[0] && handleFile(e.target.files[0])
                }
              />
              <span
                className={cn(
                  "inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium transition-all hover:border-primary/40 hover:bg-card/80",
                  uploading && "opacity-60"
                )}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5" />
                )}
                {uploading ? "Subiendo..." : "Cambiar foto"}
              </span>
            </label>
            {photo !== property.featuredPhoto && (
              <Button size="sm" variant="ghost" onClick={resetPhoto}>
                <Trash2 className="mr-1.5 h-3 w-3" />
                Original
              </Button>
            )}
            <Button size="sm" className="bg-gradient-to-r from-primary to-primary/85">
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              Exportar
            </Button>
          </div>
        </Card>

        {/* Design editor */}
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Personalizar diseño</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ToggleChip
              icon={Eye}
              label="Precio"
              active={design.showPrice}
              onClick={() => updateDesign("showPrice", !design.showPrice)}
            />
            <ToggleChip
              icon={Eye}
              label="Título"
              active={design.showTitle}
              onClick={() => updateDesign("showTitle", !design.showTitle)}
            />
            <ToggleChip
              icon={MapPin}
              label="Ubicación"
              active={design.showLocation}
              onClick={() => updateDesign("showLocation", !design.showLocation)}
            />
            <ToggleChip
              icon={Sparkles}
              label="Watermark"
              active={design.showWatermark}
              onClick={() => updateDesign("showWatermark", !design.showWatermark)}
            />
          </div>

          <div className="mt-3">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Posición del overlay
            </label>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {(["top", "center", "bottom"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => updateDesign("overlayPos", p)}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                    design.overlayPos === p
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-foreground/20"
                  )}
                >
                  {p === "top" ? "Arriba" : p === "center" ? "Centro" : "Abajo"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Color del texto
            </label>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              {(["white", "dark"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => updateDesign("textColor", c)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                    design.textColor === c
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-foreground/20"
                  )}
                >
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full ring-1 ring-black/20",
                      c === "white" ? "bg-white" : "bg-stone-900"
                    )}
                  />
                  {c === "white" ? "Blanco" : "Oscuro"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Texto del watermark
            </label>
            <input
              type="text"
              value={design.brandingText}
              onChange={(e) => updateDesign("brandingText", e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-border bg-card px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="estaila"
            />
          </div>
        </Card>

        {/* Marketing kits — personalizable + persistente */}
        <KitSection propertyId={property.id} initialKits={marketingKits} />
      </div>

      {/* RIGHT: AI tools — bounded scroll so hashtags don't push other widgets off-screen */}
      <div className="lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto hide-scrollbar space-y-4 lg:pb-6">
        <AIWidget
          title="Caption con IA"
          description="Texto del post listo para Instagram"
          icon={Send}
          loading={loading === "caption"}
          onGenerate={() => gen("caption")}
          hasResults={caption.length > 0}
        >
          {caption.map((text, i) => (
            <pre
              key={i}
              className="cursor-pointer whitespace-pre-wrap rounded-md bg-muted/50 p-2 font-sans text-[11px] leading-relaxed transition-colors hover:bg-muted"
              onClick={() => copyText(text)}
              title="Click para copiar"
            >
              {text}
            </pre>
          ))}
        </AIWidget>

        <AIWidget
          title="Hashtags relevantes"
          description="Etiquetas optimizadas por categoría + ubicación"
          icon={Hash}
          loading={loading === "hashtags"}
          onGenerate={() => gen("hashtags")}
          hasResults={hashtags.length > 0}
        >
          {hashtags.length > 0 && (
            <>
              <div className="max-h-32 overflow-y-auto hide-scrollbar">
                <div className="flex flex-wrap gap-1">
                  {hashtags.map((h) => (
                    <button
                      key={h}
                      onClick={() => copyText(h)}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary transition-colors hover:bg-primary/20"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => copyText(hashtags.join(" "))}
              >
                <Copy className="mr-1.5 h-3 w-3" />
                Copiar todos ({hashtags.length})
              </Button>
            </>
          )}
        </AIWidget>

        <AIWidget
          title="Bio para Instagram"
          description="Variaciones para tu perfil o landing"
          icon={Users}
          loading={loading === "bios"}
          onGenerate={() => gen("bios")}
          hasResults={bios.length > 0}
        >
          {bios.map((text, i) => (
            <pre
              key={i}
              className="cursor-pointer whitespace-pre-wrap rounded-md bg-muted/50 p-2 font-sans text-[11px] leading-relaxed transition-colors hover:bg-muted"
              onClick={() => copyText(text)}
              title="Click para copiar"
            >
              {text}
            </pre>
          ))}
        </AIWidget>
      </div>
    </div>
  );
}

function ToggleChip({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-all",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-foreground/20"
      )}
    >
      {active ? (
        <Icon className="h-3 w-3" strokeWidth={1.75} />
      ) : (
        <EyeOff className="h-3 w-3" strokeWidth={1.75} />
      )}
      {label}
    </button>
  );
}

function AIWidget({
  title,
  description,
  icon: Icon,
  loading,
  onGenerate,
  hasResults,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  loading: boolean;
  onGenerate: () => void;
  hasResults: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">{title}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={onGenerate}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
        )}
        {hasResults ? "Regenerar" : "Generar"}
      </Button>
      {hasResults && <div className="mt-3 space-y-2">{children}</div>}
    </Card>
  );
}

// ============================================================
// LANDING TAB
// ============================================================

function LandingTab({
  property,
  hasSite,
  siteSlug,
}: {
  property: PropertyForHub;
  hasSite: boolean;
  siteSlug: string | null;
}) {
  const publicUrl = hasSite && siteSlug
    ? `/p/${siteSlug}/${property.id}`
    : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-muted/30 px-5 py-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-xs font-mono">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">
              {publicUrl ? `realestate-x.app${publicUrl}` : "Sin publicar"}
            </span>
          </p>
          {publicUrl && (
            <Button asChild variant="outline" size="sm">
              <Link href={publicUrl} target="_blank">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Abrir landing
              </Link>
            </Button>
          )}
        </div>
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {property.featuredPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.featuredPhoto}
              alt=""
              className="h-full w-full object-cover blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="font-mono text-3xl font-bold tabular-nums text-white">
              {formatCurrency(property.priceUSD ?? 0)}
            </p>
            <p className="text-base text-white/80">{property.title}</p>
            {property.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-white/60">
                <MapPin className="h-3 w-3" />
                {property.location}
              </p>
            )}
          </div>
          {!hasSite && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="text-center">
                <Home className="mx-auto h-10 w-10 text-white/70" />
                <p className="mt-3 text-base font-semibold text-white">
                  Crea tu sitio público
                </p>
                <p className="mt-1 max-w-sm text-sm text-white/70">
                  Activa tu portal inmobiliario y cada propiedad tendrá su landing page automática.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/sitio">
                    Configurar sitio
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Incluye automáticamente
          </h3>
          <ul className="space-y-2 text-xs">
            {[
              "Galería premium con lightbox",
              "Datos completos + amenidades",
              "Botón WhatsApp directo",
              "Formulario de contacto inteligente",
              "Mapa interactivo",
              "Compartir en redes sociales",
              "Mobile-first + SEO friendly",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {f}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5">
          <div className="mb-2 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Próximamente
          </div>
          <h3 className="text-sm font-semibold">Promesa de venta digital</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Reserva online · firma digital · PDF automático · notificación al agente.
          </p>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// ANALYTICS TAB
// ============================================================

function AnalyticsTab({
  analytics,
  hasSite,
}: {
  analytics: PropertyAnalytics;
  hasSite: boolean;
}) {
  const { views, shares, clicks, leads } = analytics;
  const hasData = views > 0 || shares > 0 || clicks > 0 || leads > 0;

  // Métricas derivadas de datos reales (sin inventar nada).
  const convRate = views > 0 ? (leads / views) * 100 : 0;
  const clickRate = shares > 0 ? (clicks / shares) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* KPIs reales de esta propiedad */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard icon={Eye} label="Visitas" value={views} accent="primary" />
        <MetricCard icon={Share2} label="Compartidos" value={shares} accent="emerald" />
        <MetricCard icon={MousePointer} label="Clics en enlaces" value={clicks} accent="amber" />
        <MetricCard icon={Users} label="Leads" value={leads} accent="rose" />
      </div>

      {!hasData ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Activity className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="max-w-sm">
            <h3 className="text-sm font-semibold">Aún sin datos de esta propiedad</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Comparte la propiedad con el botón Compartir de arriba
              {hasSite ? " o publícala en tu sitio" : ""}. En cuanto reciba
              visitas y clics reales, las métricas aparecerán aquí
              automáticamente.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-primary" strokeWidth={1.75} />
            Embudo de conversión
          </h3>
          <p className="mb-5 mt-1 text-xs text-muted-foreground">
            Recorrido real desde la visita pública hasta el lead captado.
          </p>
          <div className="space-y-4">
            <FunnelRow
              icon={Eye}
              label="Visitas a la página pública"
              value={views}
              pct={100}
              accent="primary"
            />
            <FunnelRow
              icon={Users}
              label="Leads generados"
              value={leads}
              pct={convRate}
              accent="rose"
              hint={views > 0 ? `${convRate.toFixed(1)}% de conversión` : undefined}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Veces compartida
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                {formatNumber(shares)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Clics en enlaces compartidos
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                {formatNumber(clicks)}
                {shares > 0 && (
                  <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                    {clickRate.toFixed(0)}% CTR
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Honesto: tracking que aún no existe (series por día, ciudades, fuentes) */}
      <Card className="border-dashed p-5">
        <div className="mb-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Próximamente
        </div>
        <h3 className="text-sm font-semibold">Tendencias y origen del tráfico</h3>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
          Visitas por día, ciudades y dispositivos de los visitantes, y fuentes
          (Instagram, WhatsApp, web). Requiere registrar cada visita como evento;
          se activará en una próxima actualización.
        </p>
      </Card>
    </div>
  );
}

function FunnelRow({
  icon: Icon,
  label,
  value,
  pct,
  accent,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  pct: number;
  accent: "primary" | "rose";
  hint?: string;
}) {
  const barClass = accent === "primary" ? "bg-primary" : "bg-rose-500";
  const iconClass = accent === "primary" ? "text-primary" : "text-rose-500";
  // Asegura una barra visible cuando hay valor pero el % es diminuto.
  const width = value > 0 ? Math.max(pct, 3) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <Icon className={cn("h-3.5 w-3.5", iconClass)} strokeWidth={1.75} />
          {label}
        </span>
        <span className="flex items-baseline gap-2">
          {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
          <span className="font-mono text-sm font-semibold tabular-nums">
            {formatNumber(value)}
          </span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={cn("h-full rounded-full", barClass)}
        />
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  accent: "primary" | "emerald" | "amber" | "rose";
}) {
  const accentClass = {
    primary: "bg-primary/15 text-primary",
    emerald: "bg-emerald-500/15 text-emerald-500",
    amber: "bg-amber-500/15 text-amber-500",
    rose: "bg-rose-500/15 text-rose-500",
  }[accent];

  return (
    <Card className="p-4">
      <div className={cn("mb-2 inline-flex h-7 w-7 items-center justify-center rounded-md", accentClass)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
        <NumberTicker value={value} />
      </p>
    </Card>
  );
}

// ============================================================
// DOCUMENTS TAB (stub)
// ============================================================

function DocumentsTab({ property }: { property: PropertyForHub }) {
  const [openKind, setOpenKind] = useState<DocKind | null>(null);
  const [openManager, setOpenManager] = useState(false);

  const docs: { kind: DocKind; name: string; description: string; icon: LucideIcon }[] = [
    {
      kind: "CONTRACT_SALE",
      name: "Contrato de compra venta",
      description: "Múltiples plantillas con cláusulas legales personalizables.",
      icon: FileText,
    },
    {
      kind: "SALE_PROMISE",
      name: "Promesa de venta",
      description: "Reserva con exclusividad, penalidades bilaterales y plazos.",
      icon: CheckCircle2,
    },
    {
      kind: "RENTAL_CONTRACT",
      name: "Contrato de alquiler",
      description: "12 cláusulas Ley 4314: depósito, mora, mantenimiento.",
      icon: Key,
    },
    {
      kind: "PAYMENT_RECEIPT",
      name: "Recibo de pago",
      description: "Reservas, comisiones, mensualidades. Monto en letras.",
      icon: Wallet,
    },
  ];

  const docProp = {
    title: property.title,
    category: property.category,
    priceUSD: property.priceUSD,
    location: property.location,
    address: property.address ?? null,
    metersSquared: property.metersSquared,
    bedrooms: property.bedrooms,
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <Badge className="mb-2 bg-emerald-500/15 text-[10px] text-emerald-600 hover:bg-emerald-500/15">
              Disponible
            </Badge>
            <h3 className="text-lg font-bold">Generador de documentos legales</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Plantillas profundas personalizables por jurisdicción. Crea las tuyas, súbelas
              en DOCX o edita las del sistema. Exporta a PDF vía impresión del navegador.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpenManager(true)}
            className="shrink-0"
          >
            <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Gestionar plantillas
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {docs.map((d) => (
          <button
            key={d.kind}
            type="button"
            onClick={() => setOpenKind(d.kind)}
            className="flex items-start gap-3 rounded-lg border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <d.icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{d.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {d.description}
              </p>
            </div>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden
            />
          </button>
        ))}
      </div>

      {openKind && (
        <DocumentDialog
          key={openKind}
          open={!!openKind}
          onOpenChange={(v) => !v && setOpenKind(null)}
          kind={openKind}
          property={docProp}
        />
      )}

      <TemplatesManager
        open={openManager}
        onOpenChange={setOpenManager}
      />
    </div>
  );
}

// (RentalTab is imported from rental-tab.tsx — real implementation)
