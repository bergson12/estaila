"use client";

import { Sun, CloudSun, CloudRain, Palmtree } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { cn } from "@/lib/utils";

const MODES = [
  {
    value: "CLEAR",
    label: "Día Claro",
    description: "Cielo azul nítido sin nubes",
    icon: Sun,
  },
  {
    value: "TROPICAL",
    label: "Tropical",
    description: "Azul caribeño con nubes blancas suaves",
    icon: Palmtree,
  },
  {
    value: "SUNSET",
    label: "Atardecer",
    description: "Tonos dorados y rosados",
    icon: CloudSun,
  },
  {
    value: "DRAMATIC",
    label: "Dramático",
    description: "Cielo con contraste y volumen",
    icon: CloudRain,
  },
] as const;

export function SkyClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const [mode, setMode] = useState<string>("CLEAR");

  return (
    <StudioShell
      plan={plan}
      title={
        <>
          <Sun className="h-5 w-5 text-primary" strokeWidth={1.75} />
          Cielo Despejado
        </>
      }
      description="Reemplaza el cielo en fotos exteriores. Ideal para días nublados."
      optionsPanel={
        <>
          <OptionsPanel title="Tipo de cielo">
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all",
                      active
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-card/50 hover:border-foreground/20"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                      strokeWidth={1.5}
                    />
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          active ? "text-primary" : ""
                        )}
                      >
                        {m.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                        {m.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </OptionsPanel>

          <OptionsPanel title="Tip">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Funciona mejor con fotos exteriores donde el cielo es visible y
              ocupa al menos 20% de la imagen.
            </p>
          </OptionsPanel>

          <GenerateButton
            onClick={() => runGenerate({ skyMode: mode as "CLEAR" | "SUNSET" | "DRAMATIC" | "TROPICAL" })}
            label="Cambiar cielo"
          />
        </>
      }
    />
  );
}
