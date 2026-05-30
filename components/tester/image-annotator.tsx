"use client";

/**
 * ImageAnnotator — marca errores sobre un screenshot.
 *
 * Herramientas: caja, flecha, lápiz libre y texto, con selector de color.
 * Las marcas se guardan como vectores (para deshacer / re-editar) y al
 * confirmar se aplanan sobre la imagen → PNG dataURL + JSON de anotaciones.
 *
 * Adaptado del canvas de `components/studio/mask-brush.tsx`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Pen,
  RotateCcw,
  Square,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tool = "box" | "arrow" | "pen" | "text";
type Pt = { x: number; y: number };
type Shape =
  | { type: "box"; x: number; y: number; w: number; h: number; color: string }
  | { type: "arrow"; x1: number; y1: number; x2: number; y2: number; color: string }
  | { type: "pen"; points: Pt[]; color: string }
  | { type: "text"; x: number; y: number; text: string; color: string };

const COLORS = ["#E5484D", "#F5A623", "#00BF63", "#3B82F6", "#FFFFFF"];
const TOOLS: { id: Tool; label: string; Icon: typeof Square }[] = [
  { id: "box", label: "Caja", Icon: Square },
  { id: "arrow", label: "Flecha", Icon: ArrowUpRight },
  { id: "pen", label: "Lápiz", Icon: Pen },
  { id: "text", label: "Texto", Icon: Type },
];

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lw: number
) {
  const head = Math.max(12, lw * 4);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(ang - Math.PI / 6), y2 - head * Math.sin(ang - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(ang + Math.PI / 6), y2 - head * Math.sin(ang + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

export function ImageAnnotator({
  imageUrl,
  onCancel,
  onConfirm,
}: {
  imageUrl: string;
  onCancel: () => void;
  onConfirm: (r: { dataUrl: string; annotations: string }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const drawingRef = useRef(false);
  const startRef = useRef<Pt | null>(null);
  const [tool, setTool] = useState<Tool>("box");
  const [color, setColor] = useState(COLORS[0]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [draft, setDraft] = useState<Shape | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [textInput, setTextInput] = useState<{
    x: number;
    y: number;
    nx: number;
    ny: number;
    value: string;
  } | null>(null);

  const unit = useCallback(() => {
    const c = canvasRef.current;
    return c ? Math.max(2, Math.round(c.width * 0.004)) : 3;
  }, []);

  useEffect(() => {
    const img = new Image();
    if (!imageUrl.startsWith("blob:") && !imageUrl.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      bgRef.current = img;
      const c = canvasRef.current;
      if (c) {
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
      }
      setLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, s: Shape) => {
      const lw = unit();
      ctx.lineWidth = lw;
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (s.type === "box") {
        ctx.strokeRect(s.x, s.y, s.w, s.h);
      } else if (s.type === "arrow") {
        drawArrow(ctx, s.x1, s.y1, s.x2, s.y2, lw);
      } else if (s.type === "pen") {
        ctx.beginPath();
        s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.stroke();
      } else if (s.type === "text") {
        const fs = Math.max(16, Math.round((canvasRef.current?.width ?? 800) * 0.025));
        ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`;
        ctx.textBaseline = "top";
        const w = ctx.measureText(s.text).width;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(s.x - 5, s.y - 3, w + 10, fs + 8);
        ctx.fillStyle = s.color;
        ctx.fillText(s.text, s.x, s.y);
      }
    },
    [unit]
  );

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    const img = bgRef.current;
    if (!c || !img) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    for (const s of shapes) drawShape(ctx, s);
    if (draft) drawShape(ctx, draft);
  }, [shapes, draft, drawShape]);

  useEffect(() => {
    if (loaded) redraw();
  }, [loaded, redraw]);

  function toNatural(e: React.PointerEvent): Pt {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (c.width / rect.width),
      y: (e.clientY - rect.top) * (c.height / rect.height),
    };
  }

  function onDown(e: React.PointerEvent) {
    if (textInput) return;
    const p = toNatural(e);
    if (tool === "text") {
      const rect = canvasRef.current!.getBoundingClientRect();
      setTextInput({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        nx: p.x,
        ny: p.y,
        value: "",
      });
      return;
    }
    drawingRef.current = true;
    startRef.current = p;
    if (tool === "pen") setDraft({ type: "pen", points: [p], color });
    else if (tool === "box") setDraft({ type: "box", x: p.x, y: p.y, w: 0, h: 0, color });
    else if (tool === "arrow")
      setDraft({ type: "arrow", x1: p.x, y1: p.y, x2: p.x, y2: p.y, color });
  }

  function onMove(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    const p = toNatural(e);
    setDraft((d) => {
      if (!d) return d;
      if (d.type === "pen") return { ...d, points: [...d.points, p] };
      if (d.type === "box")
        return {
          ...d,
          w: p.x - (startRef.current?.x ?? p.x),
          h: p.y - (startRef.current?.y ?? p.y),
        };
      if (d.type === "arrow") return { ...d, x2: p.x, y2: p.y };
      return d;
    });
  }

  function onUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    setDraft((d) => {
      if (d) {
        const tiny =
          (d.type === "box" && Math.abs(d.w) < 6 && Math.abs(d.h) < 6) ||
          (d.type === "arrow" && Math.hypot(d.x2 - d.x1, d.y2 - d.y1) < 6) ||
          (d.type === "pen" && d.points.length < 2);
        if (!tiny) setShapes((s) => [...s, d]);
      }
      return null;
    });
    startRef.current = null;
  }

  function commitText() {
    if (textInput && textInput.value.trim()) {
      setShapes((s) => [
        ...s,
        { type: "text", x: textInput.nx, y: textInput.ny, text: textInput.value.trim(), color },
      ]);
    }
    setTextInput(null);
  }

  function confirm() {
    const c = canvasRef.current;
    if (!c) {
      onCancel();
      return;
    }
    onConfirm({ dataUrl: c.toDataURL("image/png"), annotations: JSON.stringify(shapes) });
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 p-4">
      {/* Toolbar */}
      <div className="absolute left-1/2 top-4 z-10 flex max-w-[94vw] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/80 px-3 py-2 backdrop-blur-md">
        {TOOLS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTool(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors",
              tool === id ? "bg-primary text-primary-foreground" : "hover:bg-white/10"
            )}
            title={label}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-white/15" />
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform",
                color === c ? "scale-110 border-white" : "border-white/30"
              )}
              style={{ backgroundColor: c }}
              title={`Color ${c}`}
            />
          ))}
        </div>
        <div className="mx-1 h-5 w-px bg-white/15" />
        <button
          type="button"
          onClick={() => setShapes((s) => s.slice(0, -1))}
          disabled={shapes.length === 0}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 disabled:opacity-40"
          title="Deshacer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setShapes([])}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
          title="Limpiar todo"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Canvas */}
      <div className="relative mt-16 overflow-hidden rounded-xl shadow-2xl">
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          onPointerCancel={onUp}
          className="block max-h-[74vh] max-w-[92vw] cursor-crosshair touch-none select-none"
          style={{ touchAction: "none" }}
        />
        {textInput && (
          <input
            autoFocus
            value={textInput.value}
            onChange={(e) => setTextInput((t) => (t ? { ...t, value: e.target.value } : t))}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitText();
              if (e.key === "Escape") setTextInput(null);
            }}
            onBlur={commitText}
            placeholder="Escribe y Enter…"
            className="absolute z-20 min-w-[160px] rounded-md border border-primary bg-black/85 px-2 py-1 text-sm text-white outline-none"
            style={{ left: textInput.x, top: textInput.y }}
          />
        )}
      </div>

      {/* Actions */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
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
          Guardar marcas
        </Button>
      </div>
    </div>
  );
}
