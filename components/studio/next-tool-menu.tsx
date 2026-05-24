"use client";

import {
  Sofa,
  Eraser,
  Wand2,
  Palette,
  Sun,
  Sunset,
  Waves,
  Trees,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TOOLS = [
  { href: "/studio/staging", label: "Virtual Staging", icon: Sofa, cost: 2 },
  { href: "/studio/declutter", label: "Eliminar Objetos", icon: Eraser, cost: 1 },
  { href: "/studio/enhance", label: "Mejorar Calidad", icon: Wand2, cost: 1 },
  { href: "/studio/style", label: "Cambiar Estilo", icon: Palette, cost: 2 },
  { href: "/studio/sky", label: "Cielo Despejado", icon: Sun, cost: 1 },
  { href: "/studio/twilight", label: "Atardecer", icon: Sunset, cost: 1 },
  { href: "/studio/pool", label: "Piscina", icon: Waves, cost: 1 },
  { href: "/studio/lawn", label: "Césped", icon: Trees, cost: 1 },
];

export function NextToolMenu() {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className="relative h-9 overflow-hidden bg-gradient-to-r from-primary to-primary/80 px-4 shadow-md shadow-primary/30"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{
              animation: "shimmer 2s infinite",
            }}
          />
          <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
          Pasar a otra herramienta
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Continúa con la imagen actual...
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TOOLS.map((t) => {
          const isCurrent = pathname === t.href;
          const Icon = t.icon;
          return (
            <DropdownMenuItem key={t.href} asChild disabled={isCurrent}>
              <Link href={t.href} className="cursor-pointer">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="flex-1">{t.label}</span>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {t.cost}c
                </span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
