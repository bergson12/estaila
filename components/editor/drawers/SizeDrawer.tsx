"use client";

import { useState } from "react";
import { useEditor, FORMAT_DIMENSIONS, type ExportFormat } from "@/lib/editor/store";
import { DrawerShell } from "./DrawerShell";

const PRESET_ORDER: ExportFormat[] = [
  "SQUARE",
  "STORY",
  "PORTRAIT",
  "LANDSCAPE",
  "WHATSAPP",
  "FLYER_A4",
];

export function SizeDrawer() {
  const format = useEditor((s) => s.format);
  const width = useEditor((s) => s.width);
  const height = useEditor((s) => s.height);
  const setFormat = useEditor((s) => s.setFormat);
  const setCustomSize = useEditor((s) => s.setCustomSize);
  const [customW, setCustomW] = useState(width);
  const [customH, setCustomH] = useState(height);

  return (
    <DrawerShell title="Tamaño">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        Presets
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {PRESET_ORDER.map((k) => {
          const dim = FORMAT_DIMENSIONS[k];
          const active = format === k;
          const ratio = dim.w / dim.h;
          return (
            <button
              key={k}
              onClick={() => setFormat(k)}
              className={`flex flex-col items-center gap-1.5 rounded-md border p-2 text-center transition-colors ${
                active
                  ? "border-primary/40 bg-primary/15 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              <div
                className="rounded border border-white/20"
                style={{
                  width: ratio > 1 ? 44 : 44 * ratio,
                  height: ratio > 1 ? 44 / ratio : 44,
                  background: active ? "rgba(0,191,99,0.2)" : "rgba(255,255,255,0.05)",
                }}
              />
              <span className="text-[10px] font-medium">{dim.label}</span>
              <span className="font-mono text-[9px] text-white/40">
                {dim.w}×{dim.h}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        Personalizado
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] text-white/60">Ancho (px)</span>
          <input
            type="number"
            value={customW}
            onChange={(e) => setCustomW(Number(e.target.value))}
            className="mt-0.5 w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-primary/40"
          />
        </label>
        <label className="block">
          <span className="text-[10px] text-white/60">Alto (px)</span>
          <input
            type="number"
            value={customH}
            onChange={(e) => setCustomH(Number(e.target.value))}
            className="mt-0.5 w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-primary/40"
          />
        </label>
      </div>
      <button
        onClick={() => setCustomSize(customW, customH)}
        className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Aplicar tamaño
      </button>
    </DrawerShell>
  );
}
