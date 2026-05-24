"use client";

import { Waves } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { cn } from "@/lib/utils";

const TONES = [
  { value: "TURQUOISE", label: "Turquesa", hex: "#5EEAD4" },
  { value: "AZURE", label: "Azul cielo", hex: "#7DD3FC" },
  { value: "TROPICAL", label: "Tropical", hex: "#22D3EE" },
  { value: "DEEP", label: "Profundo", hex: "#0EA5E9" },
] as const;

export function PoolClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const [tone, setTone] = useState<string>("TURQUOISE");

  return (
    <StudioShell
      plan={plan}
      title={
        <>
          <Waves className="h-5 w-5 text-primary" strokeWidth={1.75} />
          Piscina Cristalina
        </>
      }
      description="Limpia el agua, agrega reflejos y vibrancia natural."
      optionsPanel={
        <>
          <OptionsPanel title="Tono del agua">
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all",
                    tone === t.value
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-card/50 hover:border-foreground/20"
                  )}
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-md ring-1 ring-border"
                    style={{ backgroundColor: t.hex }}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      tone === t.value ? "text-primary" : ""
                    )}
                  >
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title="Incluye">
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• Agua cristalina sin algas ni manchas</li>
              <li>• Reflejos naturales en superficie</li>
              <li>• Bordes y baldosas limpias</li>
              <li>• Color uniforme</li>
            </ul>
          </OptionsPanel>

          <GenerateButton
            onClick={() => runGenerate({ preset: tone })}
            label="Limpiar piscina"
          />
        </>
      }
    />
  );
}
