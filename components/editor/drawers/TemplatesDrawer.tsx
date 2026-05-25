"use client";

import { useEditor } from "@/lib/editor/store";
import { DrawerShell } from "./DrawerShell";
import {
  TEMPLATES,
  type RealEstateTemplate,
} from "@/lib/editor/templates/real-estate-templates";
import { loadCanvas } from "@/lib/editor/fabric-init";
import { toast } from "sonner";

export function TemplatesDrawer() {
  const canvas = useEditor((s) => s.canvas);
  const setFormat = useEditor((s) => s.setFormat);

  async function applyTemplate(tpl: RealEstateTemplate) {
    if (!canvas) return;
    // Resize canvas to template dimensions
    setFormat(tpl.format as "SQUARE" | "STORY" | "LANDSCAPE");
    canvas.setDimensions({ width: tpl.width, height: tpl.height });
    canvas.backgroundColor = tpl.background;

    const json = JSON.stringify({
      version: "6.0.0",
      objects: tpl.objects,
      background: tpl.background,
    });
    try {
      await loadCanvas(canvas, json);
      toast.success(`Plantilla "${tpl.name}" aplicada`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <DrawerShell title="Plantillas">
      <p className="mb-3 text-[11px] text-white/60">
        15 plantillas inmobiliarias listas para personalizar.
      </p>
      <div className="space-y-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => applyTemplate(t)}
            className="group flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-white/10 text-xl">
              {t.thumbnail}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {t.name}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-white/50">
                {t.description}
              </p>
              <p className="mt-0.5 text-[9px] uppercase tracking-wider text-primary/80">
                {t.format} · {t.width}×{t.height}
              </p>
            </div>
          </button>
        ))}
      </div>
    </DrawerShell>
  );
}
