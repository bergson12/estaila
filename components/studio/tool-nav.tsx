"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sofa,
  Eraser,
  Wand2,
  Palette,
  Sun,
  Sunset,
  Waves,
  Trees,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOOLS = [
  { href: "/studio/staging", label: "Virtual Staging", icon: Sofa, cost: 2, featured: true },
  { href: "/studio/declutter", label: "Eliminar Objetos", icon: Eraser, cost: 1 },
  { href: "/studio/enhance", label: "Mejorar Calidad", icon: Wand2, cost: 1 },
  { href: "/studio/style", label: "Cambiar Estilo", icon: Palette, cost: 2 },
  { href: "/studio/sky", label: "Cielo Despejado", icon: Sun, cost: 1 },
  { href: "/studio/twilight", label: "Atardecer", icon: Sunset, cost: 1 },
  { href: "/studio/pool", label: "Piscina", icon: Waves, cost: 1 },
  { href: "/studio/lawn", label: "Césped", icon: Trees, cost: 1 },
];

export function ToolNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col gap-px lg:w-60">
      <Link
        href="/studio"
        className="mb-1.5 flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <Sparkles className="h-3 w-3 text-primary" />
        Studio IA
      </Link>
      {TOOLS.map((t) => {
        const active = pathname === t.href;
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                active && "text-primary",
                t.featured && !active && "text-primary/70"
              )}
              strokeWidth={1.75}
            />
            <span className="flex-1 truncate">{t.label}</span>
            <span className="font-mono text-[9px] tabular-nums text-muted-foreground">
              {t.cost}c
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
