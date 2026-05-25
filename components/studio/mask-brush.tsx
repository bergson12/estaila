"use client";

/**
 * MaskBrush — Canva-style "magic brush" selector.
 *
 * Lets the user paint a soft white mask over the image to mark the area
 * the AI should modify. Returns the mask as a data URL (PNG, black bg / white mask)
 * via `onMaskChange`.
 *
 * Usage:
 *   <MaskBrush
 *     imageUrl={imageUrl}
 *     onMaskChange={(dataUrl) => setMask(dataUrl)}
 *   />
 *
 * Toolbar:
 *   - Brush size slider
 *   - Brush / Eraser toggle
 *   - Undo
 *   - Clear all
 *   - Done (closes overlay)
 */

import { Eraser, Paintbrush, RotateCcw, Trash2, X, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Mode = "brush" | "eraser";

export function MaskBrush({
  imageUrl,
  onClose,
  onConfirm,
  initialMask,
}: {
  imageUrl: string;
  /** Cancel — discards changes */
  onClose: () => void;
  /** Confirm — passes back the final mask as data URL (or null if cleared) */
  onConfirm: (maskDataUrl: string | null) => void;
  initialMask?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [mode, setMode] = useState<Mode>("brush");
  const [brushSize, setBrushSize] = useState(40);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Sync canvas size to image once loaded
  useEffect(() => {
    if (!imgLoaded) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Start with transparent canvas (so background image shows through).
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (initialMask) {
      // Restore previous mask
      const m = new Image();
      m.crossOrigin = "anonymous";
      m.onload = () => {
        ctx.drawImage(m, 0, 0, canvas.width, canvas.height);
      };
      m.src = initialMask;
    }
  }, [imgLoaded, initialMask]);

  function pointerPos(e: React.PointerEvent): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function pushHistory() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((h) => [...h.slice(-19), snap]); // keep last 20 steps
  }

  function startDraw(e: React.PointerEvent) {
    e.preventDefault();
    pushHistory();
    setIsDrawing(true);
    const { x, y } = pointerPos(e);
    lastPointRef.current = { x, y };
    drawAt(x, y);
  }

  function moveDraw(e: React.PointerEvent) {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = pointerPos(e);
    const last = lastPointRef.current;
    if (last) {
      // Interpolate so fast strokes don't gap
      drawLine(last.x, last.y, x, y);
    } else {
      drawAt(x, y);
    }
    lastPointRef.current = { x, y };
  }

  function endDraw() {
    setIsDrawing(false);
    lastPointRef.current = null;
  }

  function drawAt(x: number, y: number) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation =
      mode === "eraser" ? "destination-out" : "source-over";
    ctx.fillStyle = "rgba(0, 191, 99, 0.6)"; // estaila green semi-transparent
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLine(x1: number, y1: number, x2: number, y2: number) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation =
      mode === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = "rgba(0, 191, 99, 0.6)";
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function undo() {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const last = history[history.length - 1];
    ctx.putImageData(last, 0, 0);
    setHistory((h) => h.slice(0, -1));
  }

  function clearAll() {
    pushHistory();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function confirm() {
    const canvas = canvasRef.current;
    if (!canvas) {
      onConfirm(null);
      return;
    }
    // Detect whether the canvas is empty (no mask drawn).
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onConfirm(null);
      return;
    }
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasPixels = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        hasPixels = true;
        break;
      }
    }
    if (!hasPixels) {
      onConfirm(null);
      return;
    }
    // Convert overlay to a strict white-on-black mask (standard inpainting format).
    const mask = document.createElement("canvas");
    mask.width = canvas.width;
    mask.height = canvas.height;
    const mctx = mask.getContext("2d");
    if (!mctx) {
      onConfirm(canvas.toDataURL("image/png"));
      return;
    }
    mctx.fillStyle = "#000";
    mctx.fillRect(0, 0, mask.width, mask.height);
    const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const dst = mctx.getImageData(0, 0, mask.width, mask.height);
    for (let i = 0; i < src.data.length; i += 4) {
      if (src.data[i + 3] > 30) {
        dst.data[i] = 255;
        dst.data[i + 1] = 255;
        dst.data[i + 2] = 255;
        dst.data[i + 3] = 255;
      }
    }
    mctx.putImageData(dst, 0, 0);
    onConfirm(mask.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4">
      {/* Top toolbar */}
      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/80 px-3 py-2 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMode("brush")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors",
            mode === "brush"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-white/10"
          )}
          title="Pincel"
        >
          <Paintbrush className="h-3.5 w-3.5" />
          Pincel
        </button>
        <button
          type="button"
          onClick={() => setMode("eraser")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors",
            mode === "eraser"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-white/10"
          )}
          title="Borrador"
        >
          <Eraser className="h-3.5 w-3.5" />
          Borrar
        </button>
        <div className="mx-1 h-5 w-px bg-white/15" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/60">
            Tamaño
          </span>
          <input
            type="range"
            min={10}
            max={150}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="font-mono text-[11px] tabular-nums text-white/80">
            {brushSize}
          </span>
        </div>
        <div className="mx-1 h-5 w-px bg-white/15" />
        <button
          type="button"
          onClick={undo}
          disabled={history.length === 0}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 disabled:opacity-40"
          title="Deshacer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
          title="Limpiar todo"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Canvas + image */}
      <div
        ref={containerRef}
        className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-xl shadow-2xl"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Imagen a editar"
          onLoad={() => setImgLoaded(true)}
          className="block max-h-[85vh] max-w-[90vw] select-none"
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          onPointerCancel={endDraw}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
          style={{ touchAction: "none" }}
        />
      </div>

      {/* Bottom actions */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="border-white/20 bg-black/60 text-white hover:bg-white/10 hover:text-white"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={confirm}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Aplicar selección
        </Button>
      </div>
    </div>
  );
}
