"use client";

import {
  ArrowRight,
  Check,
  Crown,
  Image as ImageIcon,
  Layers,
  Lock,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
  Video,
  X,
  Loader2,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AMENITY_CATALOG,
  POI_CATALOG,
  parseJSON,
  type AmenityKey,
  type POIKey,
} from "@/lib/portal-catalog";
import { cn } from "@/lib/utils";
import { searchNearbyPOIs, geocodeAddress } from "@/lib/mapbox-poi";

export type LuxuryFieldsValue = {
  premiumLanding: boolean;
  customTagline: string;
  videoUrl: string;
  walkthroughUrl: string;
  lat: string;
  lng: string;
  amenities: { key: string; custom?: string }[];
  finishes: string[];
  nearbyPois: { key: string; distance: string; custom?: string }[];
  floorPlans: {
    type: string;
    beds: number;
    baths: number;
    m2: number;
    units: number;
  }[];
};

export function parseLuxuryFromProperty(p: {
  premiumLanding?: boolean | null;
  customTagline?: string | null;
  videoUrl?: string | null;
  walkthroughUrl?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  amenities?: string;
  finishes?: string;
  nearbyPois?: string;
  floorPlans?: string;
}): LuxuryFieldsValue {
  // Migrate legacy format (string[] of keys) → object[] {key, custom?}
  const rawAmenities = parseJSON<(string | { key: string; custom?: string })[]>(
    p.amenities ?? "[]",
    []
  );
  const amenities = rawAmenities.map((a) =>
    typeof a === "string" ? { key: a } : a
  );

  return {
    premiumLanding: !!p.premiumLanding,
    customTagline: p.customTagline ?? "",
    videoUrl: p.videoUrl ?? "",
    walkthroughUrl: p.walkthroughUrl ?? "",
    lat: p.lat != null ? String(p.lat) : "",
    lng: p.lng != null ? String(p.lng) : "",
    amenities,
    finishes: parseJSON<string[]>(p.finishes ?? "[]", []),
    nearbyPois: parseJSON<{ key: string; distance: string; custom?: string }[]>(
      p.nearbyPois ?? "[]",
      []
    ),
    floorPlans: parseJSON<
      { type: string; beds: number; baths: number; m2: number; units: number }[]
    >(p.floorPlans ?? "[]", []),
  };
}

export function LuxuryFieldsEditor({
  value,
  onChange,
  userPlan,
}: {
  value: LuxuryFieldsValue;
  onChange: (v: LuxuryFieldsValue) => void;
  userPlan?: string;
}) {
  const isPremiumUser = userPlan === "PRO" || userPlan === "TEAM";
  const canEdit = isPremiumUser || value.premiumLanding;
  // The locked overlay only blocks free users from EDITING (they can still see)
  const showLockOverlay = !isPremiumUser && !value.premiumLanding;

  function set<K extends keyof LuxuryFieldsValue>(
    key: K,
    val: LuxuryFieldsValue[K]
  ) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="space-y-6">
      {/* === Premium toggle (gating) === */}
      <PremiumToggleCard
        active={value.premiumLanding}
        userPlan={userPlan}
        onToggle={(v) => set("premiumLanding", v)}
      />

      <div className={cn("space-y-6", showLockOverlay && "pointer-events-none opacity-50")}>
        {!value.premiumLanding && !showLockOverlay && (
          <div className="rounded-xl border border-muted bg-muted/30 p-4 text-xs">
            <p className="font-semibold">
              Modo estándar activo
            </p>
            <p className="mt-1 text-muted-foreground">
              Los campos abajo están deshabilitados. Activa &quot;Premium&quot; arriba para personalizar amenidades, planos, mapa, video y más.
            </p>
          </div>
        )}

        <NarrativeCard value={value} set={set} />
        <CoordinatesCard value={value} set={set} disabled={!canEdit} />
        <AmenitiesCard value={value} set={set} disabled={!canEdit} />
        <POIsCard value={value} set={set} disabled={!canEdit} />
        <FinishesCard value={value} set={set} disabled={!canEdit} />
        <FloorPlansCard value={value} set={set} disabled={!canEdit} />
      </div>
    </div>
  );
}

// ============================================================
// PREMIUM TOGGLE CARD (with plan gating)
// ============================================================

// Section catalog — shared between both modes
const STANDARD_SECTIONS = [
  { icon: ImageIcon, label: "Hero con foto + precio" },
  { icon: Layers, label: "Galería de fotos" },
  { icon: Sparkles, label: "Descripción + specs" },
  { icon: Phone, label: "Contacto + WhatsApp" },
];

const PREMIUM_SECTIONS = [
  { icon: Star, label: "Why this property (editorial)" },
  { icon: Layers, label: "Room overview slider" },
  { icon: MapPin, label: "Mapa Mapbox + POIs" },
  { icon: Crown, label: "Floor plans con tabs" },
  { icon: Video, label: "Video tour walkthrough" },
  { icon: Sparkles, label: "Amenidades + finishes" },
  { icon: TrendingUp, label: "Stats + reviews editorial" },
];

function PremiumToggleCard({
  active,
  userPlan,
  onToggle,
}: {
  active: boolean;
  userPlan?: string;
  onToggle: (v: boolean) => void;
}) {
  const isPremiumUser = userPlan === "PRO" || userPlan === "TEAM";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            Tipo de landing
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] uppercase tracking-wider",
                active
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-600"
                  : "border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {active ? "Premium activa" : "Estándar"}
            </Badge>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Elige cómo se ve la página pública de esta propiedad. Puedes cambiar
            cuando quieras.
          </p>
        </div>
      </div>

      {/* Visual comparison — two cards side-by-side */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* STANDARD */}
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={cn(
            "group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all",
            !active
              ? "border-primary bg-primary/[0.04] shadow-md"
              : "border-border bg-card hover:border-foreground/30"
          )}
        >
          {/* Mini mockup */}
          <div className="mb-4 overflow-hidden rounded-lg border bg-muted/40">
            <div className="space-y-1.5 p-3">
              {/* Hero band */}
              <div className="h-12 rounded-md bg-gradient-to-br from-slate-300 to-slate-500" />
              {/* Stats line */}
              <div className="flex gap-1">
                <div className="h-3 w-10 rounded bg-muted-foreground/30" />
                <div className="h-3 w-10 rounded bg-muted-foreground/30" />
                <div className="h-3 w-10 rounded bg-muted-foreground/30" />
              </div>
              {/* Gallery grid */}
              <div className="grid grid-cols-3 gap-1">
                <div className="aspect-square rounded bg-muted-foreground/20" />
                <div className="aspect-square rounded bg-muted-foreground/20" />
                <div className="aspect-square rounded bg-muted-foreground/20" />
              </div>
              {/* Contact button */}
              <div className="h-4 w-full rounded-full bg-foreground" />
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Estándar</p>
            {!active && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                <Check className="h-2.5 w-2.5" />
                Actual
              </span>
            )}
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Lo esencial para vender rápido. Limpio, directo, sin distracciones.
          </p>

          <ul className="space-y-1.5">
            {STANDARD_SECTIONS.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-xs">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={3} />
                </div>
                <span className="text-foreground">{s.label}</span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-[10px] font-medium text-muted-foreground">
            Incluido en todos los planes · gratis
          </p>
        </button>

        {/* PREMIUM */}
        <button
          type="button"
          onClick={() => isPremiumUser && onToggle(true)}
          disabled={!isPremiumUser}
          className={cn(
            "group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all",
            active
              ? "border-amber-500 bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.02] to-transparent shadow-lg shadow-amber-500/10"
              : isPremiumUser
                ? "border-border bg-card hover:border-amber-500/40 hover:bg-amber-500/[0.03]"
                : "border-border bg-card opacity-90"
          )}
        >
          {/* Mini mockup — premium */}
          <div className="mb-4 overflow-hidden rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-50/30 to-muted/40">
            <div className="space-y-1.5 p-3">
              {/* Cinematic hero */}
              <div className="h-12 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500" />
              {/* Marquee strip */}
              <div className="flex items-center gap-1 overflow-hidden">
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-amber-400/50 to-amber-300/20" />
              </div>
              {/* 2-col split */}
              <div className="grid grid-cols-3 gap-1">
                <div className="col-span-2 aspect-[2/1] rounded bg-muted-foreground/25" />
                <div className="aspect-square rounded bg-amber-500/20" />
              </div>
              {/* Floor plan + stats */}
              <div className="grid grid-cols-2 gap-1">
                <div className="h-4 rounded bg-amber-500/30" />
                <div className="h-4 rounded bg-muted-foreground/20" />
              </div>
              {/* Big stat number */}
              <div className="flex justify-around">
                <div className="h-3 w-8 rounded bg-amber-600" />
                <div className="h-3 w-8 rounded bg-amber-600" />
                <div className="h-3 w-8 rounded bg-amber-600" />
              </div>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              Premium
            </p>
            {active && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <Check className="h-2.5 w-2.5" />
                Activa
              </span>
            )}
            {!isPremiumUser && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                <Lock className="h-2.5 w-2.5" />
                Pro
              </span>
            )}
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Experiencia editorial cinematográfica. Para listings que justifican un
            sitio dedicado.
          </p>

          <ul className="space-y-1.5">
            <li className="flex items-center gap-2 text-xs">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={3} />
              </div>
              <span className="font-semibold">Todo lo de Estándar</span>
            </li>
            {PREMIUM_SECTIONS.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-xs">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                  <Sparkles className="h-2.5 w-2.5 text-amber-600" strokeWidth={2} />
                </div>
                <span className="text-foreground">{s.label}</span>
              </li>
            ))}
          </ul>

          {!isPremiumUser && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href="/pricing"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-105"
              >
                <Crown className="h-2.5 w-2.5" />
                Upgrade · $15/mes
              </Link>
            </div>
          )}
          {isPremiumUser && (
            <p className="mt-3 text-[10px] font-medium text-muted-foreground">
              Plan {userPlan} · incluido
            </p>
          )}
        </button>
      </div>

      {/* Selector hint */}
      <p className="text-center text-[10px] text-muted-foreground">
        Click en cualquiera de los dos para cambiar el modo
      </p>
    </div>
  );
}

// ============================================================
// NARRATIVE CARD
// ============================================================

function NarrativeCard({
  value,
  set,
}: {
  value: LuxuryFieldsValue;
  set: <K extends keyof LuxuryFieldsValue>(k: K, v: LuxuryFieldsValue[K]) => void;
}) {
  return (
    <Card className="p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Narrativa
      </h3>
      <div className="space-y-3">
        <Field label="Frase aspiracional (tagline)">
          <Input
            value={value.customTagline}
            onChange={(e) => set("customTagline", e.target.value)}
            placeholder="Ej: Vive donde otros sueñan vacacionar"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Aparece en la sección inmersiva del landing
          </p>
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Video URL (YouTube / Vimeo)">
            <Input
              value={value.videoUrl}
              onChange={(e) => set("videoUrl", e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Walkthrough URL (Matterport / 360°)">
            <Input
              value={value.walkthroughUrl}
              onChange={(e) => set("walkthroughUrl", e.target.value)}
              placeholder="https://..."
            />
          </Field>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// COORDINATES CARD — with geocoding + Mapbox URL paste
// ============================================================

function CoordinatesCard({
  value,
  set,
  disabled,
}: {
  value: LuxuryFieldsValue;
  set: <K extends keyof LuxuryFieldsValue>(k: K, v: LuxuryFieldsValue[K]) => void;
  disabled: boolean;
}) {
  const [geocoding, setGeocoding] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");

  function pickFromMapsUrl(url: string) {
    const m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) {
      set("lat", m[1]);
      set("lng", m[2]);
      toast.success("Coordenadas extraídas");
    }
  }

  async function geocode() {
    if (!addressQuery.trim()) return;
    setGeocoding(true);
    try {
      const result = await geocodeAddress(addressQuery);
      if (!result) {
        toast.error("No se encontró la dirección");
        return;
      }
      set("lat", String(result.lat));
      set("lng", String(result.lng));
      toast.success(`Coordenadas obtenidas: ${result.place ?? "ubicación"}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGeocoding(false);
    }
  }

  return (
    <Card className="p-5">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <MapPin className="h-3 w-3" />
        Coordenadas (Mapbox)
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Latitud">
          <Input
            type="text"
            disabled={disabled}
            value={value.lat}
            onChange={(e) => set("lat", e.target.value)}
            placeholder="18.4861"
            className="font-mono tabular-nums"
          />
        </Field>
        <Field label="Longitud">
          <Input
            type="text"
            disabled={disabled}
            value={value.lng}
            onChange={(e) => set("lng", e.target.value)}
            placeholder="-69.9312"
            className="font-mono tabular-nums"
          />
        </Field>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Address → geocode */}
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-3">
          <p className="mb-2 flex items-center gap-1 text-xs font-medium">
            <Wand2 className="h-3 w-3" />
            Buscar por dirección
          </p>
          <div className="flex gap-1.5">
            <Input
              value={addressQuery}
              onChange={(e) => setAddressQuery(e.target.value)}
              placeholder="Calle, ciudad, país"
              disabled={disabled || geocoding}
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  geocode();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={geocode}
              disabled={disabled || geocoding || !addressQuery.trim()}
              className="h-8 shrink-0"
            >
              {geocoding ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Navigation className="h-3 w-3" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Mapbox Geocoding · Nominatim fallback
          </p>
        </div>

        {/* Maps URL paste */}
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-3">
          <p className="mb-2 flex items-center gap-1 text-xs font-medium">
            📍 Desde URL de Maps
          </p>
          <Input
            placeholder="https://maps.google.com/...@18.48,-69.93..."
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              pickFromMapsUrl(text);
            }}
            onChange={(e) => pickFromMapsUrl(e.target.value)}
            disabled={disabled}
            className="h-8 font-mono text-xs"
          />
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// AMENITIES CARD — chips + groups + custom add
// ============================================================

function AmenitiesCard({
  value,
  set,
  disabled,
}: {
  value: LuxuryFieldsValue;
  set: <K extends keyof LuxuryFieldsValue>(k: K, v: LuxuryFieldsValue[K]) => void;
  disabled: boolean;
}) {
  const [custom, setCustom] = useState("");

  function toggle(key: string) {
    const has = value.amenities.find((a) => a.key === key);
    if (has) {
      set(
        "amenities",
        value.amenities.filter((a) => a.key !== key)
      );
    } else {
      set("amenities", [...value.amenities, { key }]);
    }
  }

  function addCustom() {
    const label = custom.trim();
    if (!label) return;
    const key = `CUSTOM_${label.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_${Date.now()}`;
    set("amenities", [...value.amenities, { key, custom: label }]);
    setCustom("");
    toast.success(`"${label}" agregada`);
  }

  // Group amenities by their "group" field
  const grouped: Record<string, AmenityKey[]> = {};
  for (const k of Object.keys(AMENITY_CATALOG) as AmenityKey[]) {
    const g = AMENITY_CATALOG[k].group ?? "Otros";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(k);
  }

  const customAmenities = value.amenities.filter((a) => a.custom);

  return (
    <Card className="p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Amenidades ({value.amenities.length} seleccionadas)
      </h3>

      <div className="space-y-4">
        {Object.entries(grouped).map(([group, keys]) => (
          <div key={group}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
              {keys.map((k) => {
                const a = AMENITY_CATALOG[k];
                const active = value.amenities.some((x) => x.key === k);
                const Icon = a.icon;
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(k)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-medium transition-all disabled:cursor-not-allowed",
                      active
                        ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Custom amenities pills */}
        {customAmenities.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Personalizadas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {customAmenities.map((a) => (
                <span
                  key={a.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-medium text-primary"
                >
                  ✨ {a.custom}
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "amenities",
                        value.amenities.filter((x) => x.key !== a.key)
                      )
                    }
                    className="hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Custom add */}
        <div className="flex gap-2 border-t border-border pt-4">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Agregar amenidad personalizada..."
            disabled={disabled}
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addCustom}
            disabled={disabled || !custom.trim()}
          >
            <Plus className="mr-1 h-3 w-3" />
            Agregar
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// POIS CARD — chips + groups + Mapbox auto-detect + custom
// ============================================================

function POIsCard({
  value,
  set,
  disabled,
}: {
  value: LuxuryFieldsValue;
  set: <K extends keyof LuxuryFieldsValue>(k: K, v: LuxuryFieldsValue[K]) => void;
  disabled: boolean;
}) {
  const [custom, setCustom] = useState("");
  const [customDist, setCustomDist] = useState("5 min");
  const [searching, setSearching] = useState(false);

  function toggle(key: string, defaultDistance = "5 min") {
    const has = value.nearbyPois.find((p) => p.key === key);
    if (has) {
      set(
        "nearbyPois",
        value.nearbyPois.filter((p) => p.key !== key)
      );
    } else {
      set("nearbyPois", [
        ...value.nearbyPois,
        { key, distance: defaultDistance },
      ]);
    }
  }

  function updateDistance(key: string, dist: string) {
    set(
      "nearbyPois",
      value.nearbyPois.map((p) => (p.key === key ? { ...p, distance: dist } : p))
    );
  }

  function addCustomPOI() {
    const label = custom.trim();
    if (!label) return;
    const key = `CUSTOM_POI_${label.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_${Date.now()}`;
    set("nearbyPois", [
      ...value.nearbyPois,
      { key, distance: customDist, custom: label },
    ]);
    setCustom("");
    toast.success(`"${label}" agregado`);
  }

  async function autoDetect() {
    const lat = parseFloat(value.lat);
    const lng = parseFloat(value.lng);
    if (!isFinite(lat) || !isFinite(lng)) {
      toast.error("Necesitas lat/lng para buscar lugares cercanos");
      return;
    }
    setSearching(true);
    try {
      const { results, warning } = await searchNearbyPOIs({ lat, lng });
      if (warning) {
        toast.message("Mapbox token no configurado", {
          description: warning,
        });
        return;
      }
      if (results.length === 0) {
        toast.message("Sin resultados cercanos");
        return;
      }
      // Merge unique by key, keep existing distances if already set
      const existing = new Map(value.nearbyPois.map((p) => [p.key, p]));
      for (const r of results) {
        if (!existing.has(r.key)) {
          existing.set(r.key, { key: r.key, distance: r.distance });
        }
      }
      set("nearbyPois", Array.from(existing.values()));
      toast.success(`${results.length} lugares detectados con Mapbox`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSearching(false);
    }
  }

  // Group POIs
  const grouped: Record<string, POIKey[]> = {};
  for (const k of Object.keys(POI_CATALOG) as POIKey[]) {
    const g = POI_CATALOG[k].group ?? "Otros";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(k);
  }

  const customPOIs = value.nearbyPois.filter((p) => p.custom);

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Lugares cercanos ({value.nearbyPois.length})
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={autoDetect}
          disabled={disabled || searching || !value.lat || !value.lng}
          className="gap-1.5"
        >
          {searching ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3 text-primary" />
          )}
          Buscar con Mapbox
        </Button>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([group, keys]) => (
          <div key={group}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {keys.map((k) => {
                const p = POI_CATALOG[k];
                const item = value.nearbyPois.find((x) => x.key === k);
                const active = !!item;
                const Icon = p.icon;
                return (
                  <div
                    key={k}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition-all",
                      active
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-card"
                    )}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggle(k)}
                      className="flex flex-1 items-center gap-2 text-left disabled:cursor-not-allowed"
                    >
                      <Icon
                        className={cn(
                          "h-3 w-3 shrink-0",
                          active ? "text-primary" : "text-muted-foreground"
                        )}
                        strokeWidth={1.75}
                      />
                      <span
                        className={cn(
                          "truncate font-medium",
                          active ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {p.label}
                      </span>
                    </button>
                    {active && item && (
                      <Input
                        value={item.distance}
                        onChange={(e) => updateDistance(k, e.target.value)}
                        placeholder="5 min"
                        disabled={disabled}
                        className="h-6 w-24 font-mono text-[10px] tabular-nums"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Custom POIs */}
        {customPOIs.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Personalizados
            </p>
            <div className="space-y-1.5">
              {customPOIs.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1.5 text-xs"
                >
                  <span className="text-primary">📍</span>
                  <span className="flex-1 truncate font-medium text-primary">
                    {p.custom}
                  </span>
                  <Input
                    value={p.distance}
                    onChange={(e) => updateDistance(p.key, e.target.value)}
                    placeholder="5 min"
                    disabled={disabled}
                    className="h-6 w-24 font-mono text-[10px] tabular-nums"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      set(
                        "nearbyPois",
                        value.nearbyPois.filter((x) => x.key !== p.key)
                      )
                    }
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom add */}
        <div className="grid grid-cols-1 gap-2 border-t border-border pt-4 sm:grid-cols-[1fr_auto_auto]">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Agregar lugar personalizado..."
            disabled={disabled}
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomPOI();
              }
            }}
          />
          <Input
            value={customDist}
            onChange={(e) => setCustomDist(e.target.value)}
            placeholder="5 min"
            disabled={disabled}
            className="h-8 w-24 font-mono text-xs tabular-nums"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addCustomPOI}
            disabled={disabled || !custom.trim()}
          >
            <Plus className="mr-1 h-3 w-3" />
            Agregar
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// FINISHES CARD
// ============================================================

function FinishesCard({
  value,
  set,
  disabled,
}: {
  value: LuxuryFieldsValue;
  set: <K extends keyof LuxuryFieldsValue>(k: K, v: LuxuryFieldsValue[K]) => void;
  disabled: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Acabados premium ({value.finishes.length})
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => set("finishes", [...value.finishes, ""])}
        >
          <Plus className="mr-1 h-3 w-3" />
          Agregar
        </Button>
      </div>
      {value.finishes.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-card/50 p-4 text-center text-xs text-muted-foreground">
          Sin acabados. Agrega los materiales y detalles que destacan tu propiedad.
        </p>
      ) : (
        <div className="space-y-2">
          {value.finishes.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">
                0{i + 1}
              </span>
              <Input
                value={f}
                onChange={(e) => {
                  const next = [...value.finishes];
                  next[i] = e.target.value;
                  set("finishes", next);
                }}
                placeholder="Ej: Cocina Bosch con isla central"
                disabled={disabled}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() =>
                  set(
                    "finishes",
                    value.finishes.filter((_, idx) => idx !== i)
                  )
                }
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================================
// FLOOR PLANS CARD
// ============================================================

function FloorPlansCard({
  value,
  set,
  disabled,
}: {
  value: LuxuryFieldsValue;
  set: <K extends keyof LuxuryFieldsValue>(k: K, v: LuxuryFieldsValue[K]) => void;
  disabled: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Planos / Tipos ({value.floorPlans.length})
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            set("floorPlans", [
              ...value.floorPlans,
              { type: "Nuevo tipo", beds: 2, baths: 2, m2: 100, units: 1 },
            ])
          }
        >
          <Plus className="mr-1 h-3 w-3" />
          Agregar tipo
        </Button>
      </div>
      {value.floorPlans.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-card/50 p-4 text-center text-xs text-muted-foreground">
          Para proyectos multi-unidad, agrega los tipos (ej: Tipo A 2hab/95m²).
        </p>
      ) : (
        <div className="space-y-3">
          {value.floorPlans.map((p, i) => (
            <div key={i} className="rounded-lg border border-border bg-card/30 p-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">
                  0{i + 1}
                </span>
                <Input
                  value={p.type}
                  onChange={(e) => {
                    const next = [...value.floorPlans];
                    next[i] = { ...next[i], type: e.target.value };
                    set("floorPlans", next);
                  }}
                  placeholder="Tipo A"
                  disabled={disabled}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    set(
                      "floorPlans",
                      value.floorPlans.filter((_, idx) => idx !== i)
                    )
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                <Field label="Hab">
                  <Input
                    type="number"
                    min={0}
                    value={p.beds}
                    disabled={disabled}
                    onChange={(e) => {
                      const next = [...value.floorPlans];
                      next[i] = { ...next[i], beds: Number(e.target.value) };
                      set("floorPlans", next);
                    }}
                    className="font-mono tabular-nums"
                  />
                </Field>
                <Field label="Baños">
                  <Input
                    type="number"
                    min={0}
                    step="0.5"
                    value={p.baths}
                    disabled={disabled}
                    onChange={(e) => {
                      const next = [...value.floorPlans];
                      next[i] = { ...next[i], baths: Number(e.target.value) };
                      set("floorPlans", next);
                    }}
                    className="font-mono tabular-nums"
                  />
                </Field>
                <Field label="m²">
                  <Input
                    type="number"
                    min={0}
                    value={p.m2}
                    disabled={disabled}
                    onChange={(e) => {
                      const next = [...value.floorPlans];
                      next[i] = { ...next[i], m2: Number(e.target.value) };
                      set("floorPlans", next);
                    }}
                    className="font-mono tabular-nums"
                  />
                </Field>
                <Field label="Unidades">
                  <Input
                    type="number"
                    min={1}
                    value={p.units}
                    disabled={disabled}
                    onChange={(e) => {
                      const next = [...value.floorPlans];
                      next[i] = { ...next[i], units: Number(e.target.value) };
                      set("floorPlans", next);
                    }}
                    className="font-mono tabular-nums"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
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
      <Label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
