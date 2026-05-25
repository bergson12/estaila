"use client";

import {
  Bath,
  Bed,
  Car,
  Compass,
  Heart,
  Home,
  Key,
  MapPin,
  Maximize2,
  Phone,
  Star,
  TreePine,
  Trees,
  Waves,
  Wifi,
} from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { useEditor } from "@/lib/editor/store";
import { DrawerShell } from "./DrawerShell";
import { tag, centerObject } from "@/lib/editor/fabric-init";

const ICONS = [
  { Icon: Home, name: "Casa" },
  { Icon: Key, name: "Llave" },
  { Icon: MapPin, name: "Ubicación" },
  { Icon: Phone, name: "Teléfono" },
  { Icon: Star, name: "Estrella" },
  { Icon: Heart, name: "Corazón" },
  { Icon: Bed, name: "Cama" },
  { Icon: Bath, name: "Baño" },
  { Icon: Car, name: "Auto" },
  { Icon: Maximize2, name: "Área" },
  { Icon: Wifi, name: "WiFi" },
  { Icon: TreePine, name: "Árbol" },
  { Icon: Trees, name: "Bosque" },
  { Icon: Waves, name: "Ola" },
  { Icon: Compass, name: "Brújula" },
];

export function IconsDrawer() {
  const canvas = useEditor((s) => s.canvas);

  async function addIcon(IconCmp: (typeof ICONS)[number]["Icon"], name: string) {
    if (!canvas) return;
    const svgEl = (
      <IconCmp width={96} height={96} stroke="#00bf63" strokeWidth={1.5} fill="none" />
    );
    const svg = renderToStaticMarkup(svgEl);
    const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24">${svg.replace(
      /<svg[^>]*>|<\/svg>/g,
      ""
    )}</svg>`;
    const { loadSVGFromString, Group } = await import("fabric");
    const result = await loadSVGFromString(wrapped);
    const objects = result.objects.filter((o) => o !== null);
    if (objects.length === 0) return;
    const group = new Group(objects);
    tag(group, "icon", name);
    centerObject(canvas, group);
  }

  return (
    <DrawerShell title="Iconos">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
        Inmobiliarios
      </p>
      <div className="grid grid-cols-4 gap-2">
        {ICONS.map((i) => (
          <button
            key={i.name}
            title={i.name}
            onClick={() => addIcon(i.Icon, i.name)}
            className="flex aspect-square items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-white"
          >
            <i.Icon className="h-5 w-5" strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </DrawerShell>
  );
}
