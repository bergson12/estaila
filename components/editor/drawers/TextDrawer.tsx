"use client";

import { useEditor } from "@/lib/editor/store";
import { DrawerShell } from "./DrawerShell";
import { tag, centerObject } from "@/lib/editor/fabric-init";

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
