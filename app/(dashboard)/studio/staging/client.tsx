"use client";

import { Sofa } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { useApplySuggestion } from "@/components/studio/use-apply-suggestion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/shared/icon";
import {
  STAGING_STYLES,
  ROOM_TYPES,
  LIGHT_MOODS,
  BUYER_TARGETS,
} from "@/lib/constants";

const DENSITIES = [
  { value: "MINIMAL", label: "Mínimo", desc: "Pocos muebles esenciales" },
  { value: "BALANCED", label: "Equilibrado", desc: "Lo justo y necesario" },
  { value: "FULL", label: "Lleno", desc: "Habitación completamente equipada" },
] as const;

const LUXURY_LEVELS = [
  { value: "ECONOMY", label: "Económico", price: "$" },
  { value: "MID", label: "Mid-range", price: "$$" },
  { value: "PREMIUM", label: "Premium", price: "$$$" },
  { value: "LUXURY", label: "Luxury", price: "$$$$" },
] as const;

export function StagingClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const [style, setStyle] = useState<string>("MODERN");
  const [roomType, setRoomType] = useState<string>("LIVING");
  const [removeFirst, setRemoveFirst] = useState(false);
  const [density, setDensity] = useState<"MINIMAL" | "BALANCED" | "FULL">(
    "BALANCED"
  );
  const [lightMood, setLightMood] = useState<string>("NATURAL");
  const [buyerTarget, setBuyerTarget] = useState<string>("");
  const [luxuryLevel, setLuxuryLevel] = useState<string>("MID");
  const [extraPrompt, setExtraPrompt] = useState("");

  useApplySuggestion({ setRoomType, setStyle, setBuyerTarget });

  function handleGenerate() {
    runGenerate({
      style,
      roomType,
      removeFurnitureFirst: removeFirst,
      density,
      lightMood,
      buyerTarget: buyerTarget || undefined,
      luxuryLevel,
      extraPrompt: extraPrompt.trim() || undefined,
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
      description="Amuebla la habitación con muebles fotorrealistas según el estilo y comprador objetivo."
      optionsPanel={
        <>
          <OptionsPanel title="Tipo de habitación">
            <div className="grid grid-cols-2 gap-1.5">
              {ROOM_TYPES.map((r) => (
                <ChipButton
                  key={r.value}
                  active={roomType === r.value}
                  onClick={() => setRoomType(r.value)}
                  icon={r.icon}
                  label={r.label}
                />
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title="Estilo de decoración">
            <div className="grid grid-cols-2 gap-1.5">
              {STAGING_STYLES.map((s) => (
                <ChipButton
                  key={s.value}
                  active={style === s.value}
                  onClick={() => setStyle(s.value)}
                  icon={s.icon}
                  label={s.label}
                />
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title="Nivel de lujo">
            <div className="grid grid-cols-4 gap-1.5">
              {LUXURY_LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLuxuryLevel(l.value)}
                  className={cn(
                    "flex flex-col items-center rounded-md border px-1 py-1.5 text-[10px] font-medium transition-all",
                    luxuryLevel === l.value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                  title={l.label}
                >
                  <span className="font-mono text-[11px]">{l.price}</span>
                  <span className="leading-tight">{l.label}</span>
                </button>
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title="Iluminación">
            <div className="grid grid-cols-1 gap-1">
              {LIGHT_MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setLightMood(m.value)}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-all",
                    lightMood === m.value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  <span>{m.label}</span>
                  <span className="text-[10px] opacity-70">{m.desc}</span>
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
                    "rounded-md border px-2 py-2 text-xs font-medium transition-all",
                    density === d.value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                  title={d.desc}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title="Buyer objetivo (opcional)">
            <p className="mb-2 text-[10px] text-muted-foreground">
              Optimiza el staging para el comprador que más buscas.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {BUYER_TARGETS.map((b) => (
                <ChipButton
                  key={b.value}
                  active={buyerTarget === b.value}
                  onClick={() =>
                    setBuyerTarget(buyerTarget === b.value ? "" : b.value)
                  }
                  icon={b.icon}
                  label={b.label}
                />
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title="Detalles extra (opcional)">
            <Textarea
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
              placeholder="Ej: agregar plantas tropicales, lámpara dorada de techo, tono terracota en cojines..."
              rows={3}
              maxLength={400}
              className="text-xs"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              {extraPrompt.length}/400
            </p>
          </OptionsPanel>

          <OptionsPanel>
            <label className="flex items-start justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">
                  Vaciar antes
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Quita muebles existentes antes de amueblar
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

function ChipButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-xs font-medium transition-all",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
      )}
    >
      {icon && (
        <Icon
          name={icon}
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            active ? "text-primary" : "text-muted-foreground/80"
          )}
        />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}
