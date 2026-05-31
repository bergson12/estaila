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
import { STAGING_STYLES, labelFor } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";
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
  labelKey: string;
  credits: number;
  style?: boolean;
}[] = [
  { value: "STAGING", labelKey: "toolStaging", credits: 2, style: true },
  { value: "ENHANCE", labelKey: "toolEnhance", credits: 1 },
  { value: "DECLUTTER", labelKey: "toolDeclutter", credits: 1 },
  { value: "STYLE_CHANGE", labelKey: "toolStyle", credits: 2, style: true },
  { value: "SKY", labelKey: "toolSky", credits: 1 },
  { value: "TWILIGHT", labelKey: "toolTwilight", credits: 1 },
  { value: "POOL", labelKey: "toolPool", credits: 1 },
  { value: "LAWN", labelKey: "toolLawn", credits: 1 },
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
  const { t, locale } = useT();
  const [tab, setTab] = useState<"upload" | "gallery">("upload");
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[] | null>(null);
  const [tool, setTool] = useState<AIToolName>("STAGING");
  const [style, setStyle] = useState("MODERN");
  const [generating, setGenerating] = useState(false);

  const toolDef = TOOLS.find((td) => td.value === tool)!;
  const toolLabel = t.asistente[toolDef.labelKey as keyof typeof t.asistente];

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
      toast.error(t.asistente.toastOnlyImages);
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
      toast.error(t.asistente.toastPickPhotoFirst);
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
        toolLabel,
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
            {t.asistente.panelTitle}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t.asistente.panelDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-5">
          {/* 1. Fuente */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t.asistente.step1Photo}
            </p>
            <div className="mb-2 flex gap-1.5">
              <TabBtn active={tab === "upload"} onClick={() => setTab("upload")}>
                {t.asistente.tabUpload}
              </TabBtn>
              <TabBtn active={tab === "gallery"} onClick={() => setTab("gallery")}>
                {t.asistente.tabGallery}
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
                      {t.asistente.uploadPrompt}
                    </span>
                  </>
                )}
              </label>
            ) : (
              <div className="grid max-h-44 grid-cols-4 gap-1.5 overflow-y-auto">
                {gallery === null ? (
                  <div className="col-span-4 flex justify-center py-6 text-xs text-muted-foreground">
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> {t.asistente.loading}
                  </div>
                ) : gallery.length === 0 ? (
                  <div className="col-span-4 py-6 text-center text-xs text-muted-foreground">
                    {t.asistente.galleryEmpty}
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
              {t.asistente.step2Tool}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {TOOLS.map((td) => (
                <button
                  key={td.value}
                  onClick={() => setTool(td.value)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-[11px] font-medium transition-all",
                    tool === td.value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20"
                  )}
                >
                  {t.asistente[td.labelKey as keyof typeof t.asistente]}
                  <span className="font-mono text-[9px] opacity-70">{td.credits}c</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Estilo (condicional) */}
          {toolDef.style && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.asistente.step3Style}
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
                    {labelFor(STAGING_STYLES, s.value, locale)}
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
            {t.asistente.cancel}
          </Button>
          <Button size="sm" onClick={runGenerate} disabled={!sourceUrl || generating}>
            {generating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t.asistente.generate} · {toolDef.credits}{" "}
            {toolDef.credits > 1 ? t.asistente.creditsPlural : t.asistente.creditSingular}
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
