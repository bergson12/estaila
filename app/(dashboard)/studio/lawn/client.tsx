"use client";

import { Trees } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { cn } from "@/lib/utils";

const STYLES = [
  { value: "MANICURED", label: "Manicurado", desc: "Cortado y uniforme" },
  { value: "LUSH", label: "Frondoso", desc: "Verde exuberante" },
  { value: "TROPICAL", label: "Tropical", desc: "Con vegetación caribeña" },
] as const;

export function LawnClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const [styleVar, setStyleVar] = useState<string>("LUSH");

  return (
    <StudioShell
      plan={plan}
      title={
        <>
          <Trees className="h-5 w-5 text-primary" strokeWidth={1.75} />
          Césped Verde
        </>
      }
      description="Reemplaza grama seca, manchas o tierra por césped exuberante."
      optionsPanel={
        <>
          <OptionsPanel title="Estilo de jardín">
            <div className="space-y-1.5">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyleVar(s.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-all",
                    styleVar === s.value
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-card/50 hover:border-foreground/20"
                  )}
                >
                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        styleVar === s.value ? "text-primary" : ""
                      )}
                    >
                      {s.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {s.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title="Resultado">
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• Reemplaza tierra, manchas y grama seca</li>
              <li>• Mantiene árboles, plantas y caminos</li>
              <li>• Color uniforme y saludable</li>
            </ul>
          </OptionsPanel>

          <GenerateButton
            onClick={() => runGenerate({ preset: styleVar })}
            label="Verde brillante"
          />
        </>
      }
    />
  );
}
