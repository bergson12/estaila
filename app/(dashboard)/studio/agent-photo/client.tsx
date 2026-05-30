"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  Download,
  Images,
  Loader2,
  Sparkles,
  Upload,
  UserSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { generateAgentPhoto } from "@/lib/actions/agent-photo";
import {
  AGENT_PHOTO_COST,
  FRAMING,
  LIGHTING,
  EXPRESSION,
  RETOUCH,
  KEEP_OPTIONS,
  type AgentPhotoInput,
} from "@/lib/ai/agent-photo-options";

type Opt = { v: string; l: string };
const ESTILOS: Opt[] = [
  { v: "corporativo", l: "Corporativo" },
  { v: "moderno", l: "Moderno" },
  { v: "calido", l: "Cálido" },
  { v: "editorial", l: "Editorial" },
  { v: "exterior", l: "Exterior" },
  { v: "lujo", l: "Lujo" },
];
const VESTIMENTA: Opt[] = [
  { v: "traje", l: "Traje formal" },
  { v: "business_casual", l: "Business casual" },
  { v: "blazer", l: "Blazer" },
  { v: "camisa", l: "Camisa" },
  { v: "actual", l: "Mantener" },
];
const FONDOS: Opt[] = [
  { v: "estudio_gris", l: "Estudio gris" },
  { v: "blanco", l: "Blanco" },
  { v: "oficina", l: "Oficina" },
  { v: "ciudad", l: "Ciudad" },
  { v: "interior_lujo", l: "Interior lujo" },
  { v: "marca", l: "Marca (verde)" },
];
const POSES: Opt[] = [
  { v: "frontal", l: "Frontal sonriendo" },
  { v: "brazos", l: "Brazos cruzados" },
  { v: "tres_cuartos", l: "3/4 perfil" },
  { v: "casual", l: "Casual" },
  { v: "actual", l: "Mantener" },
];
const ASPECTS = [
  { v: "vertical" as const, l: "Vertical", w: 17, h: 26 },
  { v: "cuadrado" as const, l: "Cuadrado", w: 23, h: 23 },
  { v: "horizontal" as const, l: "Horizontal", w: 28, h: 18 },
];

const customInputCls =
  "h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs outline-none placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

/** Convierte cualquier imagen a JPEG comprimido (pequeño, válido para OpenAI). */
async function fileToJpeg(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("No se pudo leer la imagen."));
      im.src = url;
    });
    const MAX = 2048;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (Math.max(w, h) > MAX) {
      const s = MAX / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo procesar la imagen.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) throw new Error("No se pudo convertir la imagen.");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Collapsible({
  title,
  summary,
  defaultOpen,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
      >
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <span className="flex min-w-0 items-center gap-1.5">
          {summary && (
            <span className="max-w-[140px] truncate text-[11px] font-medium text-primary">{summary}</span>
          )}
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open && <div className="space-y-2 border-t border-border px-3 py-2.5">{children}</div>}
    </div>
  );
}

function OptionGroup({
  title,
  options,
  value,
  onChange,
  defaultOpen,
}: {
  title: string;
  options: readonly Opt[];
  value: string;
  onChange: (v: string) => void;
  defaultOpen?: boolean;
}) {
  const preset = options.find((o) => o.v === value);
  return (
    <Collapsible title={title} summary={preset ? preset.l : value ? "Personalizado" : "—"} defaultOpen={defaultOpen}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={cn(
              "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all",
              value === o.v
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
            )}
          >
            {o.l}
          </button>
        ))}
      </div>
      <input
        value={preset ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="O escribe el tuyo…"
        maxLength={120}
        className={customInputCls}
      />
    </Collapsible>
  );
}

type Preset = { id: string; label: string; imageUrl: string };

export function AgentPhotoClient({
  initialCredits,
  plan,
  presets,
}: {
  initialCredits: number;
  plan: string;
  presets: Preset[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [credits, setCredits] = useState(initialCredits);
  const [inputUrl, setInputUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);

  const [style, setStyle] = useState<string>("corporativo");
  const [wardrobe, setWardrobe] = useState<string>("business_casual");
  const [background, setBackground] = useState<string>("estudio_gris");
  const [pose, setPose] = useState<string>("frontal");
  const [size, setSize] = useState<AgentPhotoInput["size"]>("vertical");
  const [framing, setFraming] = useState<string>("bust");
  const [lighting, setLighting] = useState<string>("studio");
  const [expression, setExpression] = useState<string>("confident");
  const [retouch, setRetouch] = useState<string>("natural");
  const [keep, setKeep] = useState<string[]>([]);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [extra, setExtra] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen.");
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const jpg = await fileToJpeg(file);
      const fd = new FormData();
      fd.append("file", jpg, "foto.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo subir la foto.");
      }
      const { url } = await res.json();
      setInputUrl(url);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function generate() {
    if (!inputUrl) {
      toast.error("Sube una foto primero.");
      return;
    }
    if (credits < AGENT_PHOTO_COST) {
      toast.error(`Necesitas ${AGENT_PHOTO_COST} créditos.`);
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const r = await generateAgentPhoto({
        inputUrl,
        style,
        wardrobe,
        background,
        pose,
        size,
        framing,
        lighting,
        expression,
        retouch,
        keep,
        referenceId: referenceId ?? undefined,
        extra: extra.trim() || undefined,
      });
      if (!r.ok) {
        if (r.code === "NO_KEY") toast.error("Falta configurar OPENAI_API_KEY en el servidor.");
        else if (r.code === "VERIFICATION") toast.error("Tu organización OpenAI necesita verificación para gpt-image.");
        else toast.error(r.error);
        return;
      }
      setResult(r.outputUrl);
      setModelUsed(r.model);
      setCredits(r.remainingCredits);
      toast.success(`¡Foto profesional lista! (${r.model})`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/studio" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Studio
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <Camera className="h-6 w-6 text-primary" strokeWidth={1.75} />
            Foto Pro del Agente
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lleva tu foto a nivel estudio profesional conservando tu rostro y rasgos.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Créditos</p>
            <p className="font-mono text-sm font-semibold tabular-nums">{credits}</p>
          </div>
          <Badge variant="secondary" className="bg-primary/15 text-primary">
            {plan}
          </Badge>
        </div>
      </div>

      {/* Estilo de referencia (muestras) — visible arriba */}
      <Card className="mb-5 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">Estilo de referencia (opcional)</p>
          {referenceId && (
            <button
              type="button"
              onClick={() => setReferenceId(null)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Quitar
            </button>
          )}
        </div>
        {presets.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Aún no hay fotos de muestra. El admin las sube en{" "}
            <span className="font-medium text-foreground">Admin → Fotos muestra</span> y aparecen aquí para elegir.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setReferenceId(referenceId === p.id ? null : p.id)}
                title={p.label}
                className="group shrink-0 text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={p.label}
                  className={cn(
                    "h-24 w-20 rounded-lg border-2 object-cover transition-all",
                    referenceId === p.id ? "border-primary" : "border-transparent hover:border-foreground/20"
                  )}
                />
                <span className="mt-1 block max-w-[80px] truncate text-[10px] text-muted-foreground">{p.label}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Preview */}
        <Card className="flex min-h-[420px] flex-col gap-4 p-4">
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Tu foto</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={cn(
                  "relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40",
                  inputUrl && "border-solid"
                )}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : inputUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={inputUrl} alt="origen" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1.5 p-6 text-center text-xs text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    Subir foto del agente
                  </span>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            </div>

            <div className="flex flex-col">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Resultado</p>
              <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30">
                {generating ? (
                  <span className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    Generando… (10-40s)
                  </span>
                ) : result ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result} alt="resultado" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1.5 p-6 text-center text-xs text-muted-foreground/70">
                    <UserSquare className="h-6 w-6" />
                    Aquí aparecerá tu foto profesional
                  </span>
                )}
              </div>
            </div>
          </div>

          {result && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <a href={result} download target="_blank" rel="noreferrer noopener">
                  <Button variant="outline" size="sm">
                    <Download className="mr-1.5 h-4 w-4" /> Descargar
                  </Button>
                </a>
                <Link href="/studio/galeria">
                  <Button variant="ghost" size="sm">
                    <Images className="mr-1.5 h-4 w-4" /> Ver en galería
                  </Button>
                </Link>
              </div>
              {modelUsed && (
                <p className="text-[11px] text-muted-foreground">
                  Generado con <span className="font-medium text-foreground">{modelUsed}</span>
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Controls */}
        <Card className="flex flex-col gap-2.5 p-3">
          <div className="max-h-[64vh] space-y-2 overflow-y-auto pr-1">
            <OptionGroup title="Estilo" options={ESTILOS} value={style} onChange={setStyle} defaultOpen />
            <OptionGroup title="Vestimenta" options={VESTIMENTA} value={wardrobe} onChange={setWardrobe} defaultOpen />
            <OptionGroup title="Fondo" options={FONDOS} value={background} onChange={setBackground} />
            <OptionGroup title="Pose / ángulo" options={POSES} value={pose} onChange={setPose} />
            <OptionGroup title="Encuadre" options={FRAMING} value={framing} onChange={setFraming} />
            <OptionGroup title="Iluminación" options={LIGHTING} value={lighting} onChange={setLighting} />
            <OptionGroup title="Expresión" options={EXPRESSION} value={expression} onChange={setExpression} />
            <OptionGroup title="Retoque" options={RETOUCH} value={retouch} onChange={setRetouch} />

            {/* Formato — visual */}
            <div className="rounded-xl border border-border bg-card/40 px-3 py-2.5">
              <p className="mb-1.5 text-xs font-semibold text-foreground">Formato</p>
              <div className="flex gap-2">
                {ASPECTS.map((a) => (
                  <button
                    key={a.v}
                    type="button"
                    onClick={() => setSize(a.v)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 transition-all",
                      size === a.v ? "border-primary/50 bg-primary/10" : "border-border bg-card/40 hover:border-foreground/20"
                    )}
                  >
                    <span
                      className={cn("rounded-[3px] border-2", size === a.v ? "border-primary" : "border-muted-foreground/40")}
                      style={{ width: a.w, height: a.h }}
                    />
                    <span className={cn("text-[11px] font-medium", size === a.v ? "text-primary" : "text-muted-foreground")}>
                      {a.l}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Collapsible title="Mantener exacto (de tu foto)" summary={keep.length ? `${keep.length} activos` : "—"}>
              <div className="flex flex-wrap gap-1.5">
                {KEEP_OPTIONS.map((k) => {
                  const on = keep.includes(k.v);
                  return (
                    <button
                      key={k.v}
                      type="button"
                      onClick={() => setKeep((arr) => (on ? arr.filter((x) => x !== k.v) : [...arr, k.v]))}
                      className={cn(
                        "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all",
                        on
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                      )}
                    >
                      {k.l}
                    </button>
                  );
                })}
              </div>
            </Collapsible>

            {presets.length > 0 && (
              <Collapsible title="Foto de referencia (estilo)" summary={referenceId ? "1 elegida" : "Ninguna"}>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setReferenceId(null)}
                    className={cn(
                      "flex aspect-[3/4] items-center justify-center rounded-lg border text-[10px] font-medium transition-all",
                      referenceId === null ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20"
                    )}
                  >
                    Ninguna
                  </button>
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setReferenceId(p.id)}
                      title={p.label}
                      className={cn(
                        "relative overflow-hidden rounded-lg border transition-all",
                        referenceId === p.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-foreground/20"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.label} className="aspect-[3/4] w-full object-cover" />
                    </button>
                  ))}
                </div>
              </Collapsible>
            )}

            <Collapsible title="Detalles extra (opcional)" summary={extra.trim() ? "✓" : "—"}>
              <textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Ej: agregar lentes, fondo con plantas, tono cálido, agregar una segunda persona…"
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </Collapsible>
          </div>

          <Button type="button" onClick={generate} disabled={generating || uploading || !inputUrl} className="w-full" size="lg">
            {generating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
            Generar foto pro · {AGENT_PHOTO_COST} créd
          </Button>
          <p className="text-center text-[11px] leading-snug text-muted-foreground">
            Conserva tu rostro razonablemente, pero no es perfecto. Prueba varias veces si hace falta.
          </p>
        </Card>
      </div>
    </div>
  );
}
