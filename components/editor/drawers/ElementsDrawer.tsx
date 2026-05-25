"use client";

import { Circle as CircleIcon, Square, Triangle } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { DrawerShell } from "./DrawerShell";
import { tag, centerObject } from "@/lib/editor/fabric-init";

const BADGES = [
  { label: "VENDIDO", bg: "#00bf63", color: "#fff" },
  { label: "NUEVO", bg: "#00bf63", color: "#fff" },
  { label: "EN VENTA", bg: "#dc2626", color: "#fff" },
  { label: "EXCLUSIVA", bg: "#facc15", color: "#0a0a0a" },
  { label: "PRECIO ↓", bg: "#0a0a0a", color: "#fff" },
  { label: "OPEN HOUSE", bg: "#3b82f6", color: "#fff" },
];

export function ElementsDrawer() {
  const canvas = useEditor((s) => s.canvas);

  async function addRect(fill: string) {
    if (!canvas) return;
    const { Rect } = await import("fabric");
    const r = new Rect({ width: 200, height: 120, fill, rx: 8, ry: 8 });
    tag(r, "rect", "Rectángulo");
    centerObject(canvas, r);
  }

  async function addCircle(fill: string) {
    if (!canvas) return;
    const { Circle } = await import("fabric");
    const c = new Circle({ radius: 80, fill });
    tag(c, "circle", "Círculo");
    centerObject(canvas, c);
  }

  async function addTriangle(fill: string) {
    if (!canvas) return;
    const { Triangle } = await import("fabric");
    const t = new Triangle({ width: 150, height: 130, fill });
    tag(t, "shape", "Triángulo");
    centerObject(canvas, t);
  }

  async function addBadge(b: (typeof BADGES)[number]) {
    if (!canvas) return;
    const { Rect, Textbox, Group } = await import("fabric");
    const rect = new Rect({
      width: 220,
      height: 56,
      fill: b.bg,
      rx: 28,
      ry: 28,
      originX: "center",
      originY: "center",
    });
    const txt = new Textbox(b.label, {
      width: 220,
      fontSize: 22,
      fontWeight: 900,
      fontFamily: "Raleway",
      fill: b.color,
      textAlign: "center",
      charSpacing: 200,
      originX: "center",
      originY: "center",
    });
    const group = new Group([rect, txt], { angle: -3 });
    tag(group, "badge", `Badge ${b.label}`);
    centerObject(canvas, group);
  }

  return (
    <DrawerShell title="Elementos">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        Formas
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { color: "#00bf63" },
          { color: "#0a0a0a" },
          { color: "#dc2626" },
          { color: "#facc15" },
          { color: "#3b82f6" },
          { color: "#ffffff" },
        ].map((s, i) => (
          <div key={i} className="grid grid-cols-3 gap-0.5">
            <button
              onClick={() => addRect(s.color)}
              className="flex h-12 items-center justify-center rounded border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            >
              <Square className="h-4 w-4" style={{ color: s.color }} fill={s.color} />
            </button>
            <button
              onClick={() => addCircle(s.color)}
              className="flex h-12 items-center justify-center rounded border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            >
              <CircleIcon className="h-4 w-4" style={{ color: s.color }} fill={s.color} />
            </button>
            <button
              onClick={() => addTriangle(s.color)}
              className="flex h-12 items-center justify-center rounded border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            >
              <Triangle className="h-4 w-4" style={{ color: s.color }} fill={s.color} />
            </button>
          </div>
        ))}
      </div>

      <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        Badges inmobiliarios
      </p>
      <div className="space-y-2">
        {BADGES.map((b) => (
          <button
            key={b.label}
            onClick={() => addBadge(b)}
            className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white transition-colors hover:border-primary/40"
          >
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
              style={{ background: b.bg, color: b.color }}
            >
              {b.label}
            </span>
          </button>
        ))}
      </div>
    </DrawerShell>
  );
}
