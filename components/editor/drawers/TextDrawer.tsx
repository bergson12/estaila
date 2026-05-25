"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { DrawerShell } from "./DrawerShell";
import { tag, centerObject } from "@/lib/editor/fabric-init";
import { suggestText, type TextVariation } from "@/lib/actions/ai-text";

const PRESETS: { label: string; opts: Record<string, unknown> }[] = [
  { label: "Título", opts: { text: "Tu título aquí", fontSize: 60, fontWeight: 800 } },
  { label: "Subtítulo", opts: { text: "Tu subtítulo", fontSize: 32, fontWeight: 600 } },
  { label: "Cuerpo", opts: { text: "Texto descriptivo de la propiedad", fontSize: 18, fontWeight: 400 } },
  { label: "Precio", opts: { text: "US$ 250,000", fontSize: 48, fontWeight: 900, fontFamily: "JetBrains Mono", fill: "#00bf63" } },
  { label: "Etiqueta", opts: { text: "EN VENTA", fontSize: 14, fontWeight: 700, charSpacing: 400 } },
];

const REAL_ESTATE_BLOCKS = [
  { label: "EN VENTA · Banner", text: "EN VENTA", fontSize: 48, fontWeight: 900, fill: "#fff", bg: "#dc2626" },
  { label: "VENDIDO · Diagonal", text: "VENDIDO", fontSize: 56, fontWeight: 900, fill: "#fff", bg: "#00bf63", angle: -15 },
  { label: "NUEVO LISTADO", text: "NUEVO", fontSize: 36, fontWeight: 900, fill: "#fff", bg: "#00bf63" },
  { label: "OPEN HOUSE", text: "OPEN HOUSE\nSÁBADO 10AM", fontSize: 28, fontWeight: 800, fill: "#0a0a0a", bg: "#facc15" },
  { label: "Specs estándar", text: "3 hab · 2 baños · 180m²", fontSize: 24, fontWeight: 500 },
];

export function TextDrawer() {
  const canvas = useEditor((s) => s.canvas);

  async function add(opts: Record<string, unknown>) {
    if (!canvas) return;
    const { Textbox } = await import("fabric");
    const tb = new Textbox((opts.text as string) ?? "Texto", {
      width: 400,
      fontFamily: "Raleway",
      fill: "#0a0a0a",
      ...opts,
    });
    tag(tb, "text");
    centerObject(canvas, tb);
  }

  return (
    <DrawerShell title="Texto">
      <SmartTextSection />
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        Plantillas rápidas
      </p>
      <div className="space-y-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => add(p.opts)}
            className="flex w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
          >
            <span>{p.label}</span>
            <span className="text-[10px] text-white/40">+ Agregar</span>
          </button>
        ))}
      </div>

      <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        Inmobiliarios
      </p>
      <div className="space-y-1.5">
        {REAL_ESTATE_BLOCKS.map((b) => (
          <button
            key={b.label}
            onClick={() => add(b)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
          >
            {b.label}
          </button>
        ))}
      </div>
    </DrawerShell>
  );
}

const VARIATIONS: { value: TextVariation; label: string; emoji: string }[] = [
  { value: "salesy", label: "Más vendedor", emoji: "🔥" },
  { value: "concise", label: "Más conciso", emoji: "✂️" },
  { value: "professional", label: "Más profesional", emoji: "💼" },
  { value: "caribbean", label: "Caribeño relajado", emoji: "🌴" },
  { value: "luxury", label: "Luxury", emoji: "💎" },
  { value: "english", label: "En inglés", emoji: "🇺🇸" },
];

function SmartTextSection() {
  const canvas = useEditor((s) => s.canvas);
  const selectedIds = useEditor((s) => s.selectedIds);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _tick = useEditor((s) => s.tick);
  const [loading, setLoading] = useState<TextVariation | null>(null);
  const [variations, setVariations] = useState<string[]>([]);

  const active = canvas?.getActiveObject() ?? null;
  const isText =
    active && (active.type === "Textbox" || active.type === "IText");
  const original = isText ? ((active as unknown as { text?: string }).text ?? "") : "";

  async function suggest(variation: TextVariation) {
    if (!original.trim()) return;
    setLoading(variation);
    setVariations([]);
    try {
      const results = await suggestText({ text: original, variation });
      setVariations(results);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  function applyVariation(v: string) {
    if (!canvas || !active) return;
    (active as unknown as { set: (k: string, v: unknown) => void }).set("text", v);
    canvas.renderAll();
    canvas.fire("object:modified", { target: active });
    setVariations([]);
    toast.success("Texto actualizado");
  }

  if (!isText || selectedIds.length === 0) {
    return (
      <div className="mb-5 rounded-md border border-primary/20 bg-primary/5 p-3">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" />
          Smart Text IA
        </p>
        <p className="mt-1 text-[11px] text-white/60">
          Selecciona un texto del canvas para ver sugerencias de la IA.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-md border border-primary/20 bg-primary/5 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
        <Sparkles className="h-3 w-3" />
        Smart Text IA
      </p>
      <p className="mb-2 line-clamp-2 text-[11px] italic text-white/70">
        “{original.slice(0, 60)}{original.length > 60 ? "..." : ""}”
      </p>
      <div className="grid grid-cols-2 gap-1">
        {VARIATIONS.map((v) => (
          <button
            key={v.value}
            disabled={loading !== null}
            onClick={() => suggest(v.value)}
            className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-medium text-white transition-colors hover:border-primary/40 hover:bg-primary/10 disabled:opacity-50"
          >
            {loading === v.value ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span>{v.emoji}</span>
            )}
            <span className="truncate">{v.label}</span>
          </button>
        ))}
      </div>
      {variations.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-[10px] font-semibold text-white/50">Sugerencias:</p>
          {variations.map((v, i) => (
            <button
              key={i}
              onClick={() => applyVariation(v)}
              className="block w-full rounded border border-white/10 bg-white/5 p-2 text-left text-[11px] text-white transition-colors hover:border-primary/40 hover:bg-primary/10"
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
