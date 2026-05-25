"use client";

import { Eraser, Loader2, Palette, Sofa, Sparkles, Sun, Trees, Waves, Wand2, Image as ImageIcon, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { DrawerShell } from "./DrawerShell";
import { tag, centerObject } from "@/lib/editor/fabric-init";
import { generate } from "@/lib/actions/ai";

const TOOLS = [
  { tool: "STAGING", label: "Virtual Staging", icon: Sofa, credits: 2, color: "#00bf63" },
  { tool: "DECLUTTER", label: "Eliminar objetos", icon: Eraser, credits: 1, color: "#a855f7" },
  { tool: "ENHANCE", label: "Mejorar calidad", icon: Zap, credits: 1, color: "#facc15" },
  { tool: "STYLE_CHANGE", label: "Cambiar estilo", icon: Palette, credits: 2, color: "#3b82f6" },
  { tool: "SKY", label: "Cielo despejado", icon: Sun, credits: 1, color: "#0ea5e9" },
  { tool: "TWILIGHT", label: "Atardecer", icon: Sparkles, credits: 1, color: "#f97316" },
  { tool: "POOL", label: "Piscina", icon: Waves, credits: 1, color: "#06b6d4" },
  { tool: "LAWN", label: "Césped", icon: Trees, credits: 1, color: "#22c55e" },
] as const;

export function AIDrawer() {
  const canvas = useEditor((s) => s.canvas);
  const [busy, setBusy] = useState<string | null>(null);

  async function applyToActive(toolValue: string) {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== "Image") {
      toast.error("Selecciona una imagen en el canvas primero");
      return;
    }
    const src = (active as unknown as { getSrc?: () => string; src?: string }).getSrc?.() ??
      (active as unknown as { src?: string }).src;
    if (!src) {
      toast.error("Imagen sin URL fuente");
      return;
    }

    setBusy(toolValue);
    try {
      const out = await generate({
        tool: toolValue as Parameters<typeof generate>[0]["tool"],
        inputUrl: src,
      });
      // Add result as NEW LAYER (not replace)
      const { FabricImage } = await import("fabric");
      const img = await FabricImage.fromURL(out.outputUrl, {
        crossOrigin: "anonymous",
      });
      const scaleX = (active.scaleX ?? 1) * (active.width ?? 1) / (img.width ?? 1);
      img.set({ scaleX, scaleY: scaleX, left: (active.left ?? 0) + 30, top: (active.top ?? 0) + 30 });
      tag(img, "image", `IA ${toolValue}`);
      centerObject(canvas, img);
      toast.success("Resultado aplicado como nueva capa", {
        description: `${Math.round(out.processingTimeMs / 100) / 10}s · 1 crédito`,
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <DrawerShell title="IA">
      <p className="mb-3 text-[11px] text-white/60">
        Selecciona una imagen del canvas → click una herramienta. El resultado
        se agrega como capa nueva.
      </p>
      <div className="space-y-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.tool}
            onClick={() => applyToActive(t.tool)}
            disabled={busy !== null}
            className="group flex w-full items-center gap-3 rounded-md border border-white/10 bg-white/5 p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              style={{ background: `${t.color}25`, color: t.color }}
            >
              {busy === t.tool ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <t.icon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white">{t.label}</p>
              <p className="mt-0.5 text-[10px] text-white/50">
                {t.credits} crédito{t.credits > 1 ? "s" : ""}
              </p>
            </div>
          </button>
        ))}
      </div>

      <Link
        href="/studio"
        target="_blank"
        className="mt-4 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
      >
        <Wand2 className="h-3 w-3" />
        Configuración avanzada de IA
      </Link>

      <p className="mt-3 text-[10px] text-white/40">
        Las opciones avanzadas (estilo, buyer target, iluminación) están en
        <ImageIcon className="ml-1 inline h-2.5 w-2.5" /> Studio IA.
      </p>
    </DrawerShell>
  );
}
