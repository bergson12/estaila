"use client";

import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  DollarSign,
  Eye,
  Hash,
  Loader2,
  MapPin,
  MessageCircle,
  Mail,
  MousePointer,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import {
  estimateAdReach,
  generateCaptionForProperty,
  generateHashtagsForProperty,
} from "@/lib/ai/marketing-ai";

const OBJECTIVES = [
  {
    value: "AWARENESS",
    label: "Reconocimiento",
    desc: "Llega a la mayor cantidad de personas",
    icon: Eye,
    color: "text-blue-500",
  },
  {
    value: "TRAFFIC",
    label: "Tráfico",
    desc: "Lleva visitantes a tu landing",
    icon: MousePointer,
    color: "text-purple-500",
  },
  {
    value: "ENGAGEMENT",
    label: "Interacciones",
    desc: "Likes, comentarios, compartidos",
    icon: MessageCircle,
    color: "text-pink-500",
  },
  {
    value: "LEADS",
    label: "Leads",
    desc: "Captura formularios de interesados",
    icon: Target,
    color: "text-emerald-500",
  },
  {
    value: "CONVERSIONS",
    label: "Conversiones",
    desc: "Cierres efectivos de venta/alquiler",
    icon: CheckCircle2,
    color: "text-amber-500",
  },
] as const;

const PLACEMENTS = [
  { value: "ig_feed", label: "Instagram Feed", icon: "📷" },
  { value: "ig_stories", label: "Instagram Stories", icon: "📱" },
  { value: "ig_reels", label: "Instagram Reels", icon: "🎬" },
  { value: "fb_feed", label: "Facebook Feed", icon: "📰" },
  { value: "fb_marketplace", label: "FB Marketplace", icon: "🏪" },
  { value: "messenger", label: "Messenger", icon: "💬" },
];

type Property = { id: string; title: string };

export function CampaignManagerDialog({
  open,
  onOpenChange,
  properties,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  properties: Property[];
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [objective, setObjective] = useState<string>("LEADS");
  const [audienceLocation, setAudienceLocation] = useState("LOCAL");
  const [ageMin, setAgeMin] = useState(25);
  const [ageMax, setAgeMax] = useState(55);
  const [interests, setInterests] = useState<string[]>([
    "Real estate",
    "Home buying",
  ]);
  const [placements, setPlacements] = useState<string[]>([
    "ig_feed",
    "ig_stories",
    "fb_feed",
  ]);
  const [dailyBudget, setDailyBudget] = useState(15);
  const [days, setDays] = useState(7);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [generating, setGenerating] = useState<"caption" | "hashtags" | null>(null);

  // Audience size mock — varies with location + age range + interests
  const audienceSize =
    150_000 +
    (audienceLocation === "REGION" ? 80_000 : 0) +
    Math.max(0, (ageMax - ageMin) * 4_000) +
    interests.length * 12_000;

  const [estimate, setEstimate] = useState<{
    estReach: number;
    estClicks: number;
    estLeads: number;
    estCPM: number;
    estCPL: number;
    totalSpend: number;
  } | null>(null);

  // Recompute estimate when budget/days/objective change
  useEffect(() => {
    let active = true;
    (async () => {
      const r = await estimateAdReach({
        dailyBudgetUSD: dailyBudget,
        durationDays: days,
        objective,
        audienceSize,
      });
      if (active) setEstimate(r);
    })();
    return () => {
      active = false;
    };
  }, [dailyBudget, days, objective, audienceSize]);

  async function generateCaption() {
    if (!propertyId) return toast.error("Selecciona una propiedad primero");
    setGenerating("caption");
    try {
      const r = await generateCaptionForProperty(propertyId);
      setCaption(r.captions[0]);
      toast.success("Caption generado con IA");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(null);
    }
  }

  async function generateHashtags() {
    if (!propertyId) return toast.error("Selecciona una propiedad primero");
    setGenerating("hashtags");
    try {
      const r = await generateHashtagsForProperty(propertyId);
      setHashtags(r.hashtags);
      toast.success("Hashtags generados con IA");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(null);
    }
  }

  function togglePlacement(p: string) {
    setPlacements((curr) =>
      curr.includes(p) ? curr.filter((x) => x !== p) : [...curr, p]
    );
  }

  const steps = [
    { label: "Objetivo", number: "01" },
    { label: "Audiencia", number: "02" },
    { label: "Ubicaciones", number: "03" },
    { label: "Presupuesto", number: "04" },
    { label: "Creativo", number: "05" },
  ];

  const canGoNext =
    (step === 0 && !!objective) ||
    (step === 1 && !!audienceLocation) ||
    (step === 2 && placements.length > 0) ||
    (step === 3 && dailyBudget > 0 && days > 0) ||
    step === 4;

  function reset() {
    setStep(0);
    setName("");
    setPropertyId("");
    setObjective("LEADS");
    setCaption("");
    setHashtags([]);
  }

  function handleFinish() {
    toast.success("Campaña creada (mock)", {
      description: `${formatCurrency(estimate?.totalSpend ?? 0)} · ${formatNumber(estimate?.estReach ?? 0)} alcance estimado`,
    });
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-4xl">
        {/* Header with steps */}
        <div className="border-b border-border bg-card/60 px-6 py-5 backdrop-blur-md">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              Crear campaña publicitaria
              <span className="ml-auto rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Beta · Meta Ads
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Step indicators */}
          <div className="mt-5 flex items-center gap-2">
            {steps.map((s, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <div key={s.label} className="flex flex-1 items-center gap-2">
                  <button
                    onClick={() => setStep(i)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs transition-colors",
                      active
                        ? "text-primary"
                        : done
                          ? "text-foreground hover:text-primary"
                          : "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-bold tabular-nums",
                        active
                          ? "bg-primary text-primary-foreground"
                          : done
                            ? "bg-emerald-500 text-white"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {done ? <CheckCircle2 className="h-3 w-3" /> : s.number}
                    </span>
                    <span className="hidden font-medium sm:inline">{s.label}</span>
                  </button>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-px flex-1 transition-colors",
                        done ? "bg-emerald-500" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="grid max-h-[60vh] grid-cols-1 overflow-y-auto lg:grid-cols-[1fr_18rem]">
          <div className="space-y-5 px-6 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {step === 0 && (
                  <>
                    <div>
                      <h3 className="text-base font-semibold">Define tu objetivo</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        ¿Qué quieres lograr con esta campaña?
                      </p>
                    </div>
                    <div className="space-y-2">
                      {OBJECTIVES.map((o) => {
                        const active = objective === o.value;
                        const Icon = o.icon;
                        return (
                          <button
                            key={o.value}
                            onClick={() => setObjective(o.value)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                              active
                                ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
                                : "border-border bg-card hover:border-foreground/20"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted",
                                o.color
                              )}
                            >
                              <Icon className="h-4 w-4" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold">{o.label}</p>
                              <p className="text-xs text-muted-foreground">{o.desc}</p>
                            </div>
                            {active && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Nombre de campaña
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Casa Miraflores - Lanzamiento"
                      />
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-semibold">
                        <Users className="h-4 w-4 text-primary" />
                        ¿A quién quieres llegar?
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Define tu buyer persona ideal
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          <MapPin className="-mt-0.5 mr-1 inline h-3 w-3" />
                          Ubicación
                        </Label>
                        <Select
                          value={audienceLocation}
                          onValueChange={setAudienceLocation}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOCAL">Ciudad local (50 km)</SelectItem>
                            <SelectItem value="REGION">Región amplia (200 km)</SelectItem>
                            <SelectItem value="COUNTRY">Todo el país</SelectItem>
                            <SelectItem value="INTERNATIONAL">Internacional (multi-país)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Rango de edad
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={18}
                            max={65}
                            value={ageMin}
                            onChange={(e) => setAgeMin(Number(e.target.value))}
                            className="font-mono tabular-nums"
                          />
                          <span className="text-muted-foreground">—</span>
                          <Input
                            type="number"
                            min={18}
                            max={65}
                            value={ageMax}
                            onChange={(e) => setAgeMax(Number(e.target.value))}
                            className="font-mono tabular-nums"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Intereses (separados por comas)
                      </Label>
                      <Textarea
                        rows={2}
                        value={interests.join(", ")}
                        onChange={(e) =>
                          setInterests(
                            e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          )
                        }
                        placeholder="Real estate, Home buying, Family, Investment..."
                      />
                    </div>

                    <div className="rounded-lg border border-border bg-card/50 p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Audiencia estimada</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {formatNumber(audienceSize)} personas
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, (audienceSize / 1_000_000) * 100)}%`,
                          }}
                          transition={{ duration: 0.4 }}
                          className="h-full bg-gradient-to-r from-primary to-emerald-500"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {audienceSize < 100_000
                          ? "⚠ Audiencia muy específica"
                          : audienceSize > 800_000
                            ? "⚠ Audiencia muy amplia — costos pueden aumentar"
                            : "✓ Tamaño ideal"}
                      </p>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <h3 className="text-base font-semibold">Ubicaciones del anuncio</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Dónde se mostrará tu campaña
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {PLACEMENTS.map((p) => {
                        const active = placements.includes(p.value);
                        return (
                          <button
                            key={p.value}
                            onClick={() => togglePlacement(p.value)}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border p-3 text-left transition-all",
                              active
                                ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
                                : "border-border bg-card hover:border-foreground/20"
                            )}
                          >
                            <span className="text-xl">{p.icon}</span>
                            <span className="flex-1 text-xs font-medium">{p.label}</span>
                            {active && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Selecciona al menos una ubicación. Recomendado: 3-4 para mejor optimización.
                    </p>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-semibold">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        Presupuesto y duración
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Calculadora con proyecciones en tiempo real
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <Label className="uppercase tracking-wider text-muted-foreground">
                            Presupuesto diario
                          </Label>
                          <span className="font-mono text-base font-bold tabular-nums">
                            {formatCurrency(dailyBudget)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={3}
                          max={100}
                          step={1}
                          value={dailyBudget}
                          onChange={(e) => setDailyBudget(Number(e.target.value))}
                          className="w-full accent-primary"
                        />
                        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                          <span>$3</span>
                          <span>$100</span>
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <Label className="uppercase tracking-wider text-muted-foreground">
                            Duración (días)
                          </Label>
                          <span className="font-mono text-base font-bold tabular-nums">
                            {days} días
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={30}
                          step={1}
                          value={days}
                          onChange={(e) => setDays(Number(e.target.value))}
                          className="w-full accent-primary"
                        />
                        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                          <span>1d</span>
                          <span>30d</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          Inversión total
                        </p>
                        <p className="font-mono text-3xl font-bold tabular-nums">
                          {formatCurrency(dailyBudget * days)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCurrency(dailyBudget)}/día × {days} días
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-semibold">
                        <Camera className="h-4 w-4 text-primary" />
                        Creativo del anuncio
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Caption y hashtags. La IA puede ayudarte.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Propiedad asociada
                      </Label>
                      <Select value={propertyId} onValueChange={setPropertyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una propiedad" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Texto del anuncio
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs"
                          onClick={generateCaption}
                          disabled={!propertyId || generating === "caption"}
                        >
                          {generating === "caption" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3 text-primary" />
                          )}
                          Generar con IA
                        </Button>
                      </div>
                      <Textarea
                        rows={6}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Texto que aparecerá en el anuncio..."
                        className="font-mono text-xs leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          <Hash className="-mt-0.5 mr-1 inline h-3 w-3" />
                          Hashtags
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs"
                          onClick={generateHashtags}
                          disabled={!propertyId || generating === "hashtags"}
                        >
                          {generating === "hashtags" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3 text-primary" />
                          )}
                          Sugerir
                        </Button>
                      </div>
                      <div className="flex min-h-[60px] flex-wrap items-start gap-1.5 rounded-md border border-input bg-transparent p-2">
                        {hashtags.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            Click "Sugerir" para que la IA genere hashtags relevantes
                          </span>
                        ) : (
                          hashtags.map((h) => (
                            <button
                              key={h}
                              onClick={() =>
                                setHashtags((curr) => curr.filter((x) => x !== h))
                              }
                              className="group inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                            >
                              {h}
                              <X className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right rail: Live estimate */}
          <div className="border-t border-border bg-muted/40 px-6 py-6 lg:border-l lg:border-t-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              📊 Estimación
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Proyecciones en vivo según tu configuración
            </p>

            <div className="mt-5 space-y-3">
              {estimate && (
                <>
                  <StatRow
                    icon={<Eye className="h-3.5 w-3.5" />}
                    label="Alcance"
                    value={formatNumber(estimate.estReach)}
                    sub="personas"
                  />
                  <StatRow
                    icon={<MousePointer className="h-3.5 w-3.5" />}
                    label="Clicks"
                    value={formatNumber(estimate.estClicks)}
                    sub="visitantes"
                  />
                  <StatRow
                    icon={<Target className="h-3.5 w-3.5" />}
                    label="Leads"
                    value={formatNumber(estimate.estLeads)}
                    sub="interesados"
                    highlight
                  />
                </>
              )}
            </div>

            <div className="mt-5 space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">CPM</span>
                <span className="font-mono tabular-nums">
                  {estimate ? formatCurrency(estimate.estCPM) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">CPL</span>
                <span className="font-mono tabular-nums">
                  {estimate ? formatCurrency(estimate.estCPL) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Total a invertir</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(dailyBudget * days)}
                </span>
              </div>
            </div>

            <p className="mt-6 text-[10px] leading-relaxed text-muted-foreground">
              * Estimaciones basadas en benchmarks 2025 del sector inmobiliario. Resultados reales pueden variar según calidad del creativo, segmentación y temporada.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border bg-card/60 px-6 py-3 backdrop-blur-md">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Atrás
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext}
                className="bg-gradient-to-r from-primary to-primary/85"
              >
                Continuar
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                className="bg-gradient-to-r from-primary to-emerald-500"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Lanzar campaña
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatRow({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      key={value}
      initial={{ opacity: 0.5, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-3 rounded-lg p-2.5",
        highlight && "bg-primary/10"
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md",
          highlight ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-mono text-base font-semibold tabular-nums">{value}</p>
      </div>
      <span className="text-[10px] text-muted-foreground">{sub}</span>
    </motion.div>
  );
}
