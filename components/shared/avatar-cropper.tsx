"use client";

/**
 * AvatarCropper — modal to drag + zoom an image before upload.
 *
 * Outputs a 512×512 cropped PNG blob via onConfirm.
 *
 * Usage:
 *   const [src, setSrc] = useState<string | null>(null);
 *   <input onChange={(e) => {
 *     const f = e.target.files?.[0];
 *     if (f) setSrc(URL.createObjectURL(f));
 *   }} />
 *   {src && (
 *     <AvatarCropper
 *       src={src}
 *       onConfirm={(blob) => uploadBlob(blob)}
 *       onCancel={() => setSrc(null)}
 *     />
 *   )}
 */

import { Check, Loader2, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type CropShape = "circle" | "square" | "wide" | "ultrawide";

const PRESETS: Record<
  CropShape,
  { aspect: number; outW: number; outH: number; previewW: number; previewH: number; recommended: string }
> = {
  circle: {
    aspect: 1,
    outW: 512,
    outH: 512,
    previewW: 320,
    previewH: 320,
    recommended: "512×512px · cuadrada",
  },
  square: {
    aspect: 1,
    outW: 1080,
    outH: 1080,
    previewW: 320,
    previewH: 320,
    recommended: "1080×1080px · 1:1",
  },
  wide: {
    aspect: 16 / 9,
    outW: 1600,
    outH: 900,
    previewW: 400,
    previewH: 225,
    recommended: "1600×900px · 16:9 (portada)",
  },
  ultrawide: {
    aspect: 3,
    outW: 1500,
    outH: 500,
    previewW: 450,
    previewH: 150,
    recommended: "1500×500px · banner panorámico",
  },
};

export function AvatarCropper({
  src,
  onConfirm,
  onCancel,
  outputType = "image/jpeg",
  quality = 0.9,
  shape = "circle",
}: {
  src: string;
  onConfirm: (blob: Blob) => void | Promise<void>;
  onCancel: () => void;
  outputType?: "image/jpeg" | "image/png" | "image/webp";
  quality?: number;
  shape?: CropShape;
}) {
  const preset = PRESETS[shape];
  const PREVIEW_W = preset.previewW;
  const PREVIEW_H = preset.previewH;
  const OUT_W = preset.outW;
  const OUT_H = preset.outH;
  const previewRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!imgLoaded || !imgRef.current) return;
    const img = imgRef.current;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    setImgNatural({ w: natW, h: natH });
    // Initial scale: cover the preview window (so neither dimension shows the bg)
    const initial = Math.max(PREVIEW_W / natW, PREVIEW_H / natH);
    setScale(initial);
    setPos({ x: 0, y: 0 });
  }, [imgLoaded, PREVIEW_W, PREVIEW_H]);

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      px: pos.x,
      py: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPos({
      x: dragStartRef.current.px + dx,
      y: dragStartRef.current.py + dy,
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    setDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => clamp(s + delta, 0.2, 5));
  }

  const cropAndExport = useCallback(async () => {
    if (!imgRef.current || !imgNatural.w) return;
    setProcessing(true);
    try {
      const img = imgRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = OUT_W;
      canvas.height = OUT_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D no soportado");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Preview uses CSS transform translate(x,y) scale(s) rotate(deg).
      // Map same transform to output canvas. Ratio scales preview→output
      // coordinates.
      const ratio = OUT_W / PREVIEW_W;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, OUT_W, OUT_H);
      ctx.save();
      ctx.translate(OUT_W / 2, OUT_H / 2);
      ctx.translate(pos.x * ratio, pos.y * ratio);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale * ratio, scale * ratio);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, outputType, quality)
      );
      if (!blob) throw new Error("No se pudo generar el blob");
      await onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  }, [imgNatural.w, pos, rotation, scale, outputType, quality, onConfirm, OUT_W, OUT_H, PREVIEW_W]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 p-4">
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Ajusta tu foto</h2>
          <button
            onClick={onCancel}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-1 text-xs text-muted-foreground">
          Arrastra para encuadrar. Slider o rueda del mouse para zoom.
        </p>
        <p className="mb-3 text-[11px] font-medium text-primary">
          Recomendado: {preset.recommended}
        </p>

        {/* Preview window */}
        <div className="flex justify-center">
          <div
            ref={previewRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            style={{
              width: PREVIEW_W,
              height: PREVIEW_H,
              touchAction: "none",
            }}
            className={`relative overflow-hidden border-2 border-border bg-muted cursor-grab active:cursor-grabbing select-none ${
              shape === "circle" ? "rounded-full" : "rounded-xl"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt=""
              onLoad={() => setImgLoaded(true)}
              draggable={false}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: "center",
                userSelect: "none",
                pointerEvents: "none",
                maxWidth: "none",
              }}
            />
            {/* Grid overlay (rule of thirds) */}
            <div
              className={`pointer-events-none absolute inset-0 opacity-30 ${
                shape === "circle" ? "rounded-full" : "rounded-xl"
              }`}
            >
              <div className="absolute left-0 right-0 top-1/3 h-px bg-white" />
              <div className="absolute left-0 right-0 top-2/3 h-px bg-white" />
              <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white" />
              <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 space-y-3">
          {/* Zoom */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Zoom</span>
              <span className="font-mono text-foreground tabular-nums">
                {Math.round(scale * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScale((s) => clamp(s - 0.1, 0.2, 5))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <input
                type="range"
                min={0.2}
                max={5}
                step={0.01}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <button
                type="button"
                onClick={() => setScale((s) => clamp(s + 0.1, 0.2, 5))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Rotate */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => r - 90)}
              className="flex-1"
            >
              <RotateCw className="mr-1.5 h-3.5 w-3.5 -scale-x-100" />
              Izquierda
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => r + 90)}
              className="flex-1"
            >
              <RotateCw className="mr-1.5 h-3.5 w-3.5" />
              Derecha
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={processing}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={cropAndExport}
            disabled={processing || !imgLoaded}
            className="flex-1"
          >
            {processing ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            )}
            Usar esta foto
          </Button>
        </div>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
