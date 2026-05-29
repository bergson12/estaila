"use client";

/**
 * GeneratePanel — Studio IA dentro del chat (P-006 v1).
 *
 * Elige una foto (sube nueva o reusa de la galería), una herramienta y
 * (si aplica) un estilo, genera con Gemini vía la server action generate()
 * y devuelve el resultado al chat para mostrar antes/después inline.
 */

import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { generate } from "@/lib/actions/ai";
import { listMyGenerations, type GalleryItem } from "@/lib/actions/ai";
import { compressImage } from "@/lib/compress-image";
import { STAGING_STYLES } from "@/lib/constants";
import type { AIToolName } from "@/lib/ai/types";

export type GenResult = {
  beforeUrl: string;
  afterUrl: string;
  generationId: string;
  toolLabel: string;
  creditsUsed: number;
  remaining: number;
  fallbackUsed?: "mock";
};

const TOOLS: {
  value: AIToolName;
  label: string;
  credits: number;
  style?: boolean;
}[] = [
  { value: "STAGING", label: "Amueblar", credits: 2, style: true },
  { value: "ENHANCE", label: "Mejorar", credits: 1 },
  { value: "DECLUTTER", label: "Vaciar", credits: 1 },
  { value: "STYLE_CHANGE", label: "Estilo", credits: 2, style: true },
  { value: "SKY", label: "Cielo", credits: 1 },
  { value: "TWILIGHT", label: "Atardecer", credits: 1 },
  { value: "POOL", label: "Piscina", credits: 1 },
  { value: "LAWN", label: "Césped", credits: 1 },
];

export function GeneratePanel({
  open,
  onClose,
  onResult,
}: {
  open: boolean;
  onClose: () => void;
  onResult: (r: GenResult) => void;
}) {
  const [tab, setTab] = useState<"upload" | "gallery">("upload");
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[] | null>(null);
  const [tool, setTool] = useState<AIToolName>("STAGING");
  const [style, setStyle] = useState("MODERN");
  const [generating, setGenerating] = useState(false);

  const toolDef = TOOLS.find((t) => t.value === tool)!;

  useEffect(() => {
    if (!open) return;
    // Reset transient state on open
    setSourceUrl(null);
    setGenerating(false);
    if (tab === "gallery" && gallery === null) {
      listMyGenerations(40).then(setGallery).catch(() => setGallery([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (tab === "gallery" && gallery === null) {
      listMyGenerations(40).then(setGallery).catch(() => setGallery([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo imágenes");
      return;
    }
    setUploading(true);
    try {
      const compressed = await compressImage(file, "raw");
      const form = new FormData();
      form.append("file", compressed);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir");
      setSourceUrl(data.url as string);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function runGenerate() {
    if (!sourceUrl) {
      toast.error("Elige una foto primero");
      return;
    }
    setGenerating(true);
    try {
      const options =
        tool === "STAGING" || tool === "STYLE_CHANGE" ? { style } : undefined;
      const out = await generate({ tool, inputUrl: sourceUrl, options });
      if (!out.ok) {
        toast.error(out.error, { duration: 8000 });
        return;
      }
      onResult({
        beforeUrl: sourceUrl,
        afterUrl: out.outputUrl,
        generationId: out.id,
        toolLabel: toolDef.label,
        creditsUsed: out.creditsUsed,
        remaining: out.remainingCredits,
        fallbackUsed: out.fallbackUsed,
      });
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Generar con Studio IA
          </DialogTitle>
          <DialogDescription className="text-xs">
            Elige una foto, la herramienta y genera sin salir del chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-5">
          {/* 1. Fuente */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              1 · Foto
            </p>
            <div className="mb-2 flex gap-1.5">
              <TabBtn active={tab === "upload"} onClick={() => setTab("upload")}>
                Subir
              </TabBtn>
              <TabBtn active={tab === "gallery"} onClick={() => setTab("gallery")}>
                Galería
              </TabBtn>
            </div>

            {tab === "upload" ? (
              <label
                className={cn(
                  "flex aspect-[16/9] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/30 text-center transition-all hover:border-primary/40",
                  uploading && "pointer-events-none opacity-60"
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) =>
                    e.target.files?.[0] && handleUpload(e.target.files[0])
                  }
                />
                {sourceUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={sourceUrl}
                    alt=""
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <>
                    <ImagePlus className="mb-2 h-6 w-6 text-primary" strokeWidth={1.5} />
                    <span className="text-xs text-muted-foreground">
                      Sube o arrastra una foto
                    </span>
                  </>
                )}
              </label>
            ) : (
              <div className="grid max-h-44 grid-cols-4 gap-1.5 overflow-y-auto">
                {gallery === null ? (
                  <div className="col-span-4 flex justify-center py-6 text-xs text-muted-foreground">
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Cargando...
                  </div>
                ) : gallery.length === 0 ? (
                  <div className="col-span-4 py-6 text-center text-xs text-muted-foreground">
                    Sin fotos en tu galería.
                  </div>
                ) : (
                  gallery.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSourceUrl(g.outputUrl)}
                      className={cn(
                        "aspect-square overflow-hidden rounded-lg ring-2 transition-all",
                        sourceUrl === g.outputUrl
                          ? "ring-primary"
                          : "ring-transparent hover:ring-border"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={g.outputUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 2. Herramienta */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              2 · Herramienta
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {TOOLS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTool(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-[11px] font-medium transition-all",
                    tool === t.value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20"
                  )}
                >
                  {t.label}
                  <span className="font-mono text-[9px] opacity-70">{t.credits}c</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Estilo (condicional) */}
          {toolDef.style && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                3 · Estilo
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {STAGING_STYLES.slice(0, 9).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-[11px] font-medium transition-all",
                      style === s.value
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-border bg-popover px-5 py-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={generating}>
            <X className="mr-1 h-3.5 w-3.5" />
            Cancelar
          </Button>
          <Button size="sm" onClick={runGenerate} disabled={!sourceUrl || generating}>
            {generating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            Generar · {toolDef.credits} crédito{toolDef.credits > 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
