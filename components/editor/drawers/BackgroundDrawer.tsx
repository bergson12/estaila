"use client";

import { useEditor } from "@/lib/editor/store";
import { DrawerShell } from "./DrawerShell";

const PRESET_COLORS = [
  "#ffffff",
  "#fafafa",
  "#0a0a0a",
  "#15151B",
  "#00bf63",
  "#facc15",
  "#dc2626",
  "#3b82f6",
  "#a855f7",
  "#fce7f3",
  "#fef3c7",
  "#dbeafe",
];

const GRADIENTS = [
  { name: "Sunset", from: "#fb923c", to: "#dc2626" },
  { name: "Tropical", from: "#0fb574", to: "#0891b2" },
  { name: "Lavender", from: "#a855f7", to: "#3b82f6" },
  { name: "Sand", from: "#fef3c7", to: "#fb923c" },
  { name: "Mint", from: "#a7f3d0", to: "#00bf63" },
  { name: "Night", from: "#15151B", to: "#3b82f6" },
];

export function BackgroundDrawer() {
  const canvas = useEditor((s) => s.canvas);
  const bump = useEditor((s) => s.bump);

  function setColor(c: string) {
    if (!canvas) return;
    canvas.backgroundColor = c;
    canvas.renderAll();
    canvas.fire("object:modified");
    bump();
  }

  return (
    <DrawerShell title="Fondo">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        Color sólido
      </p>
      <div className="grid grid-cols-6 gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="aspect-square rounded-md border border-white/15 transition-transform hover:scale-110"
            style={{ background: c }}
            title={c}
          />
        ))}
      </div>
      <input
        type="color"
        onChange={(e) => setColor(e.target.value)}
        className="mt-3 h-9 w-full cursor-pointer rounded border border-white/15 bg-transparent"
      />

      <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        Gradientes
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {GRADIENTS.map((g) => (
          <button
            key={g.name}
            onClick={() =>
              setColor(`linear-gradient(135deg, ${g.from}, ${g.to})`)
            }
            className="h-12 rounded-md text-[10px] font-medium text-white shadow-inner"
            style={{
              background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
            }}
          >
            {g.name}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-white/50">
        Los gradientes se aplican como CSS — para PNG export usa color sólido.
      </p>
    </DrawerShell>
  );
}
