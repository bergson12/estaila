"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
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
import { AGENT_PHOTO_COST, type AgentPhotoInput } from "@/lib/ai/agent-photo-options";

const ESTILOS = [
  { v: "corporativo", l: "Corporativo" },
  { v: "moderno", l: "Moderno" },
  { v: "calido", l: "Cálido" },
  { v: "editorial", l: "Editorial" },
  { v: "exterior", l: "Exterior" },
  { v: "lujo", l: "Lujo" },
] as const;
const VESTIMENTA = [
  { v: "traje", l: "Traje formal" },
  { v: "business_casual", l: "Business casual" },
  { v: "blazer", l: "Blazer" },
  { v: "camisa", l: "Camisa" },
  { v: "actual", l: "Mantener" },
] as const;
const FONDOS = [
  { v: "estudio_gris", l: "Estudio gris" },
  { v: "blanco", l: "Blanco" },
  { v: "oficina", l: "Oficina" },
  { v: "ciudad", l: "Ciudad" },
  { v: "interior_lujo", l: "Interior lujo" },
  { v: "marca", l: "Marca (verde)" },
] as const;
const POSES = [
  { v: "frontal", l: "Frontal sonriendo" },
  { v: "brazos", l: "Brazos cruzados" },
  { v: "tres_cuartos", l: "3/4 perfil" },
  { v: "casual", l: "Casual" },
  { v: "actual", l: "Mantener" },
] as const;
const FORMATOS = [
  { v: "vertical", l: "Vertical" },
  { v: "cuadrado", l: "Cuadrado" },
  { v: "horizontal", l: "Horizontal" },
] as const;

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { v: T; l: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
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
  );
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-foreground">{title}</p>
      {children}
    </div>
  );
}

export function AgentPhotoClient({
  initialCredits,
  plan,
}: {
  initialCredits: number;
  plan: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [credits, setCredits] = useState(initialCredits);
  const [inputUrl, setInputUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [style, setStyle] = useState<AgentPhotoInput["style"]>("corporativo");
  const [wardrobe, setWardrobe] = useState<AgentPhotoInput["wardrobe"]>("business_casual");
  const [background, setBackground] = useState<AgentPhotoInput["background"]>("estudio_gris");
  const [pose, setPose] = useState<AgentPhotoInput["pose"]>("frontal");
  const [size, setSize] = useState<AgentPhotoInput["size"]>("vertical");
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
      const fd = new FormData();
      fd.append("file", file);
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
      const r = await generateAgentPhoto({ inputUrl, style, wardrobe, background, pose, size, extra: extra.trim() || undefined });
      if (!r.ok) {
        if (r.code === "NO_KEY") {
          toast.error("Falta configurar OPENAI_API_KEY en el servidor.");
        } else if (r.code === "VERIFICATION") {
          toast.error("Tu organización OpenAI necesita verificación para gpt-image-1.");
        } else {
          toast.error(r.error);
        }
        return;
      }
      setResult(r.outputUrl);
      setCredits(r.remainingCredits);
      toast.success("¡Foto profesional lista!");
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
          <Link
            href="/studio"
            className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
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

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Preview */}
        <Card className="flex min-h-[420px] flex-col gap-4 p-4">
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            {/* Source */}
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

            {/* Result */}
            <div className="flex flex-col">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Resultado</p>
              <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30">
                {generating ? (
                  <span className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    Generando… (10-30s)
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
          )}
        </Card>

        {/* Controls */}
        <Card className="flex flex-col gap-4 p-4">
          <Field title="Estilo">
            <Chips options={ESTILOS} value={style} onChange={setStyle} />
          </Field>
          <Field title="Vestimenta">
            <Chips options={VESTIMENTA} value={wardrobe} onChange={setWardrobe} />
          </Field>
          <Field title="Fondo">
            <Chips options={FONDOS} value={background} onChange={setBackground} />
          </Field>
          <Field title="Pose / ángulo">
            <Chips options={POSES} value={pose} onChange={setPose} />
          </Field>
          <Field title="Formato">
            <Chips options={FORMATOS} value={size} onChange={setSize} />
          </Field>
          <Field title="Detalles extra (opcional)">
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Ej: agregar lentes, fondo con plantas, tono cálido, agregar una segunda persona…"
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Button
            type="button"
            onClick={generate}
            disabled={generating || uploading || !inputUrl}
            className="mt-1 w-full"
            size="lg"
          >
            {generating ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-4 w-4" />
            )}
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
