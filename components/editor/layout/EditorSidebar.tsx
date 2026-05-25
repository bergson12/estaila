"use client";

import {
  Building2,
  Image as ImageIcon,
  LayoutGrid,
  Maximize2,
  Palette,
  Shapes,
  Sparkles,
  Star,
  Type,
} from "lucide-react";
import { useEditor, type DrawerKey } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

const TOOLS: { key: DrawerKey; icon: typeof ImageIcon; label: string; shortcut?: string }[] = [
  { key: "image", icon: ImageIcon, label: "Imagen", shortcut: "I" },
  { key: "ai", icon: Sparkles, label: "IA", shortcut: "A" },
  { key: "text", icon: Type, label: "Texto", shortcut: "T" },
  { key: "elements", icon: Shapes, label: "Elementos", shortcut: "E" },
  { key: "icons", icon: Star, label: "Iconos" },
  { key: "brand", icon: Building2, label: "Marca" },
  { key: "templates", icon: LayoutGrid, label: "Plantillas" },
  { key: "background", icon: Palette, label: "Fondo" },
  { key: "size", icon: Maximize2, label: "Tamaño" },
];

export function EditorSidebar() {
  const drawer = useEditor((s) => s.drawer);
  const toggleDrawer = useEditor((s) => s.toggleDrawer);

  return (
    <div className="flex h-full w-16 shrink-0 flex-col items-center gap-1 border-r border-white/10 bg-[#15151B] p-2">
      {TOOLS.map((t) => {
        const active = drawer === t.key;
        return (
          <button
            key={t.key}
            onClick={() => toggleDrawer(t.key)}
            title={t.label + (t.shortcut ? ` (${t.shortcut})` : "")}
            className={cn(
              "group relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[9px] font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            <t.icon className="h-4 w-4" strokeWidth={1.75} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
