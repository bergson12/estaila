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
import { useT } from "@/lib/i18n/provider";

export function NextToolMenu() {
  const pathname = usePathname();
  const { t } = useT();

  const TOOLS = [
    { href: "/studio/staging", label: t.studio.toolStagingTitle, icon: Sofa, cost: 2 },
    { href: "/studio/declutter", label: t.studio.toolDeclutterTitle, icon: Eraser, cost: 1 },
    { href: "/studio/enhance", label: t.studio.toolEnhanceTitle, icon: Wand2, cost: 1 },
    { href: "/studio/style", label: t.studio.toolStyleTitle, icon: Palette, cost: 2 },
    { href: "/studio/sky", label: t.studio.toolSkyTitle, icon: Sun, cost: 1 },
    { href: "/studio/twilight", label: t.studio.toolTwilightShort, icon: Sunset, cost: 1 },
    { href: "/studio/pool", label: t.studio.toolPoolShort, icon: Waves, cost: 1 },
    { href: "/studio/lawn", label: t.studio.toolLawnShort, icon: Trees, cost: 1 },
  ];

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
          {t.studio.passToAnotherTool}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t.studio.continueWithCurrentImage}
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
