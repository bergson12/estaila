"use client";

import { Sofa } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { STAGING_STYLES, ROOM_TYPES } from "@/lib/constants";

const DENSITIES = [
  { value: "MINIMAL", label: "Mínimo" },
  { value: "BALANCED", label: "Equilibrado" },
  { value: "FULL", label: "Lleno" },
] as const;

export function StagingClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const [style, setStyle] = useState<string>("CARIBENO");
  const [roomType, setRoomType] = useState<string>("LIVING");
  const [removeFirst, setRemoveFirst] = useState(false);
  const [density, setDensity] = useState<"MINIMAL" | "BALANCED" | "FULL">(
    "BALANCED"
  );

  function handleGenerate() {
    runGenerate({
      style,
      roomType,
      removeFurnitureFirst: removeFirst,
      density,
    });
  }

  return (
    <StudioShell
      plan={plan}
      title={
        <>
          <Sofa className="h-5 w-5 text-primary" strokeWidth={1.75} />
          Virtual Staging
        </>
      }
      description="Amuebla una habitación vacía con muebles fotorrealistas."
      optionsPanel={
        <>
          <OptionsPanel title="Estilo">
            <div className="grid grid-cols-2 gap-1.5">
              {STAGING_STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all",
                    style === s.value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title="Tipo de habitación">
            <div className="grid grid-cols-2 gap-1.5">
              {ROOM_TYPES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRoomType(r.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all",
                    roomType === r.value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title="Cantidad de muebles">
            <div className="grid grid-cols-3 gap-1.5">
              {DENSITIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDensity(d.value)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-xs font-medium transition-all",
                    density === d.value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel>
            <label className="flex items-start justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">Quitar muebles primero</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Si la foto ya tiene muebles, vaciar antes de amueblar.
                </p>
              </div>
              <Switch checked={removeFirst} onCheckedChange={setRemoveFirst} />
            </label>
          </OptionsPanel>

          <GenerateButton onClick={handleGenerate} label="Amueblar" />
        </>
      }
    />
  );
}
