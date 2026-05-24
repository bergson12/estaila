"use client";

import { Eraser, Trash2, User, Briefcase } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { cn } from "@/lib/utils";

const MODES = [
  {
    value: "AUTO",
    label: "Vaciar todo",
    description: "Quita todos los muebles y objetos automáticamente",
    icon: Eraser,
  },
  {
    value: "FURNITURE",
    label: "Solo muebles",
    description: "Mantiene plantas, cuadros y elementos decorativos",
    icon: Trash2,
  },
  {
    value: "PEOPLE",
    label: "Solo personas",
    description: "Útil para fotos con personas que no deberían estar",
    icon: User,
  },
  {
    value: "PERSONAL",
    label: "Objetos personales",
    description: "Quita papeles, juguetes, ropa y desorden",
    icon: Briefcase,
  },
] as const;

export function DeclutterClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const [mode, setMode] = useState<"AUTO" | "FURNITURE" | "PEOPLE" | "PERSONAL">(
    "AUTO"
  );

  return (
    <StudioShell
      plan={plan}
      title={
        <>
          <Eraser className="h-5 w-5 text-primary" strokeWidth={1.75} />
          Eliminar Objetos
        </>
      }
      description="Limpia la habitación dejándola lista para amueblar o mostrar vacía."
      optionsPanel={
        <>
          <OptionsPanel title="¿Qué quitar?">
            <div className="space-y-2">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all",
                      active
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-card/50 hover:border-foreground/20"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                        active
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          active ? "text-primary" : ""
                        )}
                      >
                        {m.label}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
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
              Para resultados óptimos, las fotos deben tener buena iluminación
              y los objetos a eliminar visibles claramente.
            </p>
          </OptionsPanel>

          <GenerateButton
            onClick={() => runGenerate({ declutterMode: mode })}
            label="Limpiar"
          />
        </>
      }
    />
  );
}
