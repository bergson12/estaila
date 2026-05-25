"use client";

/**
 * Canva-style photo editor — Studio's final layer.
 *
 * Lets the user add text, logos, badges, arrows and emoji on top of a generated
 * staging photo, then export the composition as a downloadable PNG.
 *
 * Lightweight: pure DOM + html2canvas at export time (no Konva / Fabric).
 */

import {
  ChevronDown,
  Download,
  ImagePlus,
  Layers,
  Loader2,
  Move,
  Plus,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/compress-image";

type LayerBase = {
  id: string;
  // % positions (0–100) relative to canvas
  x: number;
  y: number;
  // rotation degrees
  r: number;
};

type TextLayer = LayerBase & {
  kind: "text";
  text: string;
  fontSize: number;
  color: string;
  bg: string | null;
  fontWeight: 400 | 600 | 800;
  fontFamily: "sans" | "serif" | "display";
};

type ImageLayer = LayerBase & {
  kind: "image";
  src: string;
  w: number; // % width
};

type BadgeLayer = LayerBase & {
  kind: "badge";
  text: string;
  variant: "sold" | "new" | "price" | "exclusive";
};

type Layer = TextLayer | ImageLayer | BadgeLayer;

const FONT_FAMILIES = {
  sans: "var(--font-sans)",
  serif: '"Playfair Display", Georgia, serif',
  display: '"Fraunces", Georgia, serif',
} as const;

const BADGE_PRESETS: Record<
  BadgeLayer["variant"],
  { bg: string; text: string; defaultLabel: string }
> = {
  sold: { bg: "#dc2626", text: "#fff", defaultLabel: "VENDIDO" },
  new: { bg: "#00bf63", text: "#fff", defaultLabel: "NUEVO" },
  price: { bg: "#0a0a0a", text: "#fff", defaultLabel: "$ 250,000" },
  exclusive: { bg: "#facc15", text: "#0a0a0a", defaultLabel: "EXCLUSIVA" },
};

export function PhotoEditor({
  imageUrl,
  onClose,
}: {
  imageUrl: string;
  onClose: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<{
    id: string;
    startX: number;
    startY: number;
    layerX: number;
    layerY: number;
  } | null>(null);
  const [exporting, setExporting] = useState(false);

  function addText() {
    const id = crypto.randomUUID();
    const text: TextLayer = {
      id,
      kind: "text",
      x: 50,
      y: 50,
      r: 0,
      text: "Tu título aquí",
      fontSize: 36,
      color: "#ffffff",
      bg: null,
      fontWeight: 800,
      fontFamily: "display",
    };
    setLayers((l) => [...l, text]);
    setSelected(id);
  }

  function addBadge(variant: BadgeLayer["variant"]) {
    const id = crypto.randomUUID();
    const preset = BADGE_PRESETS[variant];
    const layer: BadgeLayer = {
      id,
      kind: "badge",
      x: 50,
      y: 15,
      r: -6,
      text: preset.defaultLabel,
      variant,
    };
    setLayers((l) => [...l, layer]);
    setSelected(id);
  }

  async function addImage(file: File) {
    try {
      const compressed = await compressImage(file, "thumbnail");
      const reader = new FileReader();
      reader.onload = () => {
        const id = crypto.randomUUID();
        const layer: ImageLayer = {
          id,
          kind: "image",
          x: 70,
          y: 75,
          r: 0,
          src: reader.result as string,
          w: 18,
        };
        setLayers((l) => [...l, layer]);
        setSelected(id);
      };
      reader.readAsDataURL(compressed);
    } catch {
      toast.error("No se pudo agregar la imagen");
    }
  }

  function update(id: string, patch: Partial<Layer>) {
    setLayers((arr) =>
      arr.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l))
    );
  }

  function remove(id: string) {
    setLayers((arr) => arr.filter((l) => l.id !== id));
    if (selected === id) setSelected(null);
  }

  function onPointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;
    setSelected(id);
    setDrag({
      id,
      startX: e.clientX,
      startY: e.clientY,
      layerX: layer.x,
      layerY: layer.y,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;
    update(drag.id, {
      x: clamp(drag.layerX + dx, 2, 98),
      y: clamp(drag.layerY + dy, 2, 98),
    } as Partial<Layer>);
  }

  function onPointerUp() {
    setDrag(null);
  }

  async function exportPng() {
    setExporting(true);
    try {
      // Lazy-import to keep page bundle small
      const { default: html2canvas } = await import("html2canvas-pro");
      const stage = stageRef.current;
      if (!stage) return;
      const canvas = await html2canvas(stage, {
        useCORS: true,
        backgroundColor: null,
        scale: 2,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `estaila-editor-${Date.now()}.png`;
      a.click();
      toast.success("Imagen descargada");
    } catch (e) {
      toast.error((e as Error).message ?? "No se pudo exportar");
    } finally {
      setExporting(false);
    }
  }

  // Keyboard delete
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selected) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        remove(selected);
      }
      if (e.key === "Escape") setSelected(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  const selectedLayer = layers.find((l) => l.id === selected) ?? null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/95">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2 text-white">
          <Layers className="h-4 w-4" />
          <span className="text-sm font-semibold">Editor</span>
          <span className="ml-2 hidden text-[11px] text-white/50 sm:inline">
            {layers.length} capa{layers.length !== 1 && "s"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportPng}
            disabled={exporting}
            className="border-primary/40 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {exporting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            Descargar PNG
          </Button>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div className="flex w-16 flex-col items-center gap-1 border-r border-white/10 bg-black/40 p-2">
          <ToolBtn onClick={addText} label="Texto" icon={<Type className="h-4 w-4" />} />
          <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white" title="Imagen">
            <ImagePlus className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addImage(f);
                e.target.value = "";
              }}
            />
          </label>
          <div className="my-1 h-px w-full bg-white/10" />
          <ToolBtn
            onClick={() => addBadge("sold")}
            label="VENDIDO"
            badge="#dc2626"
          />
          <ToolBtn
            onClick={() => addBadge("new")}
            label="NUEVO"
            badge="#00bf63"
          />
          <ToolBtn
            onClick={() => addBadge("price")}
            label="Precio"
            badge="#0a0a0a"
          />
          <ToolBtn
            onClick={() => addBadge("exclusive")}
            label="Exclusiva"
            badge="#facc15"
          />
        </div>

        {/* Canvas */}
        <div
          className="relative flex flex-1 items-center justify-center overflow-auto p-6"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onClick={() => setSelected(null)}
        >
          <div
            ref={stageRef}
            className="relative max-h-full max-w-full select-none"
            style={{ touchAction: "none" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              crossOrigin="anonymous"
              className="block max-h-[calc(100vh-12rem)] max-w-[calc(100vw-22rem)] object-contain"
              draggable={false}
            />
            {layers.map((layer) => (
              <LayerNode
                key={layer.id}
                layer={layer}
                selected={selected === layer.id}
                onPointerDown={onPointerDown}
                onChange={update}
              />
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 overflow-y-auto border-l border-white/10 bg-black/60 p-3 text-white">
          {selectedLayer ? (
            <PropertiesPanel
              layer={selectedLayer}
              onChange={(patch) => update(selectedLayer.id, patch)}
              onDelete={() => remove(selectedLayer.id)}
            />
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center text-xs text-white/60">
              <Move className="mx-auto mb-2 h-5 w-5 text-white/40" />
              Selecciona una capa o agrega texto / logos desde la barra
              izquierda.
            </div>
          )}

          {layers.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                Capas
              </p>
              <ul className="space-y-1">
                {[...layers].reverse().map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(l.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-[11px] transition-colors",
                        selected === l.id
                          ? "border-primary/50 bg-primary/15 text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <span className="text-[10px] opacity-60">
                        {l.kind === "text" ? "Aa" : l.kind === "image" ? "🖼️" : "🏷️"}
                      </span>
                      <span className="truncate">
                        {l.kind === "text"
                          ? l.text
                          : l.kind === "badge"
                            ? l.text
                            : "Imagen"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(l.id);
                        }}
                        className="ml-auto rounded p-0.5 opacity-60 transition-opacity hover:bg-white/10 hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function ToolBtn({
  onClick,
  label,
  icon,
  badge,
}: {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
    >
      {icon ?? (
        <span
          className="h-4 w-4 rounded-sm ring-1 ring-white/20"
          style={{ background: badge }}
        />
      )}
    </button>
  );
}

function LayerNode({
  layer,
  selected,
  onPointerDown,
  onChange,
}: {
  layer: Layer;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onChange: (id: string, patch: Partial<Layer>) => void;
}) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    transform: `translate(-50%, -50%) rotate(${layer.r}deg)`,
    cursor: selected ? "move" : "pointer",
    outline: selected ? "2px dashed rgba(0,191,99,0.9)" : "none",
    outlineOffset: 4,
  };

  if (layer.kind === "text") {
    return (
      <div
        style={{
          ...style,
          fontFamily: FONT_FAMILIES[layer.fontFamily],
          fontSize: layer.fontSize,
          color: layer.color,
          fontWeight: layer.fontWeight,
          background: layer.bg ?? "transparent",
          padding: layer.bg ? "0.1em 0.5em" : 0,
          borderRadius: layer.bg ? "0.25em" : 0,
          textShadow: layer.bg
            ? "none"
            : "0 2px 8px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.8)",
          whiteSpace: "pre",
          lineHeight: 1.1,
        }}
        onPointerDown={(e) => onPointerDown(e, layer.id)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          const next = prompt("Editar texto:", layer.text);
          if (next !== null) onChange(layer.id, { text: next });
        }}
      >
        {layer.text || "—"}
      </div>
    );
  }

  if (layer.kind === "image") {
    return (
      <div style={style} onPointerDown={(e) => onPointerDown(e, layer.id)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={layer.src}
          alt=""
          draggable={false}
          style={{
            width: `${layer.w}vw`,
            maxWidth: 280,
            height: "auto",
            display: "block",
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }

  // badge
  const preset = BADGE_PRESETS[layer.variant];
  return (
    <div
      style={{
        ...style,
        background: preset.bg,
        color: preset.text,
        padding: "0.5em 1em",
        borderRadius: 999,
        fontWeight: 800,
        letterSpacing: "0.06em",
        fontSize: 14,
        boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
        whiteSpace: "pre",
      }}
      onPointerDown={(e) => onPointerDown(e, layer.id)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        const next = prompt("Editar texto del badge:", layer.text);
        if (next !== null) onChange(layer.id, { text: next });
      }}
    >
      {layer.text}
    </div>
  );
}

function PropertiesPanel({
  layer,
  onChange,
  onDelete,
}: {
  layer: Layer;
  onChange: (patch: Partial<Layer>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
          {layer.kind === "text"
            ? "Texto"
            : layer.kind === "image"
              ? "Imagen"
              : "Badge"}
        </p>
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-1 text-white/60 transition-colors hover:bg-red-500/20 hover:text-red-400"
          title="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {layer.kind === "text" && (
        <>
          <Field label="Texto">
            <Input
              value={layer.text}
              onChange={(e) => onChange({ text: e.target.value } as Partial<Layer>)}
              className="bg-white/5 text-white"
            />
          </Field>
          <Field label="Tamaño">
            <input
              type="range"
              min={12}
              max={120}
              value={layer.fontSize}
              onChange={(e) =>
                onChange({ fontSize: Number(e.target.value) } as Partial<Layer>)
              }
              className="w-full accent-primary"
            />
          </Field>
          <Field label="Color de texto">
            <ColorRow
              value={layer.color}
              onChange={(c) => onChange({ color: c } as Partial<Layer>)}
            />
          </Field>
          <Field label="Fondo">
            <div className="flex items-center gap-2">
              <ColorRow
                value={layer.bg ?? "transparent"}
                onChange={(c) => onChange({ bg: c } as Partial<Layer>)}
              />
              {layer.bg && (
                <button
                  type="button"
                  onClick={() => onChange({ bg: null } as Partial<Layer>)}
                  className="text-[10px] text-white/50 hover:text-white"
                >
                  Quitar
                </button>
              )}
            </div>
          </Field>
          <Field label="Peso">
            <div className="grid grid-cols-3 gap-1">
              {[400, 600, 800].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() =>
                    onChange({ fontWeight: w as 400 | 600 | 800 } as Partial<Layer>)
                  }
                  className={cn(
                    "rounded border px-2 py-1 text-[10px] transition-colors",
                    layer.fontWeight === w
                      ? "border-primary/50 bg-primary/15 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  )}
                  style={{ fontWeight: w }}
                >
                  {w === 400 ? "Light" : w === 600 ? "Bold" : "Black"}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Tipografía">
            <div className="grid grid-cols-3 gap-1">
              {(["sans", "serif", "display"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() =>
                    onChange({ fontFamily: f } as Partial<Layer>)
                  }
                  className={cn(
                    "rounded border px-2 py-1 text-[10px] transition-colors",
                    layer.fontFamily === f
                      ? "border-primary/50 bg-primary/15 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  )}
                >
                  {f === "sans" ? "Sans" : f === "serif" ? "Serif" : "Display"}
                </button>
              ))}
            </div>
          </Field>
        </>
      )}

      {layer.kind === "image" && (
        <Field label="Tamaño (% de ancho)">
          <input
            type="range"
            min={5}
            max={60}
            value={layer.w}
            onChange={(e) =>
              onChange({ w: Number(e.target.value) } as Partial<Layer>)
            }
            className="w-full accent-primary"
          />
          <p className="mt-1 text-[10px] text-white/50">{layer.w}%</p>
        </Field>
      )}

      {layer.kind === "badge" && (
        <>
          <Field label="Texto">
            <Input
              value={layer.text}
              onChange={(e) => onChange({ text: e.target.value } as Partial<Layer>)}
              className="bg-white/5 text-white"
            />
          </Field>
          <Field label="Variante">
            <div className="grid grid-cols-4 gap-1">
              {(["sold", "new", "price", "exclusive"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    onChange({
                      variant: v,
                    } as Partial<Layer>)
                  }
                  className={cn(
                    "rounded border px-1 py-1 text-[10px] transition-colors",
                    layer.variant === v
                      ? "border-primary/50 bg-primary/15 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                  )}
                  style={{ background: BADGE_PRESETS[v].bg, color: BADGE_PRESETS[v].text }}
                >
                  {BADGE_PRESETS[v].defaultLabel.slice(0, 8)}
                </button>
              ))}
            </div>
          </Field>
        </>
      )}

      <Field label="Rotación">
        <input
          type="range"
          min={-45}
          max={45}
          value={layer.r}
          onChange={(e) => onChange({ r: Number(e.target.value) } as Partial<Layer>)}
          className="w-full accent-primary"
        />
        <p className="mt-1 text-[10px] text-white/50">{layer.r}°</p>
      </Field>
    </div>
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
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/50">
        {label}
      </span>
      {children}
    </label>
  );
}

const QUICK_COLORS = [
  "#ffffff",
  "#0a0a0a",
  "#00bf63",
  "#dc2626",
  "#facc15",
  "#3b82f6",
  "#a855f7",
];

function ColorRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {QUICK_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "h-6 w-6 rounded-full border-2 transition-transform",
            value === c
              ? "scale-110 border-white"
              : "border-white/20 hover:scale-105"
          )}
          style={{ background: c }}
        />
      ))}
      <input
        type="color"
        value={value === "transparent" ? "#ffffff" : value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-6 cursor-pointer rounded border border-white/20 bg-transparent"
      />
    </div>
  );
}
