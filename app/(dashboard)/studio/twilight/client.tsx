"use client";

import { Sunset, TrendingUp } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { cn } from "@/lib/utils";

const INTENSITIES = [
  { value: "SUBTLE", label: "Sutil", desc: "Hora dorada suave" },
  { value: "GOLDEN", label: "Dorado", desc: "Cálido y vibrante" },
  { value: "DRAMATIC", label: "Dramático", desc: "Máximo contraste" },
] as const;

export function TwilightClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const [intensity, setIntensity] = useState<string>("GOLDEN");

  return (
    <StudioShell
      plan={plan}
      title={
        <>
          <Sunset className="h-5 w-5 text-primary" strokeWidth={1.75} />
          Atardecer Dorado
        </>
      }
      description="Convierte fotos de día en escenas de atardecer cinematográficas."
      optionsPanel={
        <>
          <OptionsPanel>
            <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium text-primary">
                  +35% más clicks
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Las fotos al atardecer reciben en promedio 35% más interés
                  según data de portales inmobiliarios.
                </p>
              </div>
            </div>
          </OptionsPanel>

          <OptionsPanel title="Intensidad">
            <div className="grid grid-cols-3 gap-1.5">
              {INTENSITIES.map((i) => (
                <button
                  key={i.value}
                  onClick={() => setIntensity(i.value)}
                  className={cn(
                    "flex flex-col items-start rounded-lg border px-2.5 py-2 text-left transition-all",
                    intensity === i.value
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-card/50 hover:border-foreground/20"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      intensity === i.value ? "text-primary" : ""
                    )}
                  >
                    {i.label}
                  </span>
                  <span className="mt-0.5 text-[10px] text-muted-foreground">
                    {i.desc}
                  </span>
                </button>
              ))}
            </div>
          </OptionsPanel>

          <GenerateButton
            onClick={() => runGenerate({ preset: intensity })}
            label="Aplicar atardecer"
          />
        </>
      }
    />
  );
}
