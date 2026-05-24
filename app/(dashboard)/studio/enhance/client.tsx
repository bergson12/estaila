"use client";

import { Wand2, Zap } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { cn } from "@/lib/utils";

const PRESETS = [
  { value: "AUTO", label: "Auto mejora", desc: "Un click, IA decide" },
  { value: "INTERIOR_DARK", label: "Interior oscuro", desc: "Sube luz, claridad" },
  { value: "YELLOW_TONES", label: "Tonos amarillos", desc: "Corrige tono cálido" },
  { value: "PHONE_PHOTO", label: "Foto de celular", desc: "Saturación + nitidez" },
  { value: "CLOUDY", label: "Día nublado", desc: "Más viveza y luz" },
] as const;

export function EnhanceClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const [preset, setPreset] = useState<string>("AUTO");
  const [advanced, setAdvanced] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [sharpness, setSharpness] = useState(0);
  const [whiteBalance, setWhiteBalance] = useState(0);

  function handleGenerate() {
    runGenerate({
      preset,
      brightness,
      contrast,
      saturation,
      sharpness,
      whiteBalance,
    });
  }

  return (
    <StudioShell
      plan={plan}
      title={
        <>
          <Wand2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
          Mejorar Calidad
        </>
      }
      description="Auto-mejora la foto: brillo, color, nitidez y balance de blancos."
      optionsPanel={
        <>
          <OptionsPanel title="Preset">
            <div className="space-y-1.5">
              {PRESETS.map((p) => {
                const active = preset === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() => setPreset(p.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-all",
                      active
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-card/50 hover:border-foreground/20"
                    )}
                  >
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          active ? "text-primary" : ""
                        )}
                      >
                        {p.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.desc}
                      </p>
                    </div>
                    {p.value === "AUTO" && active && (
                      <Zap className="h-3.5 w-3.5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </OptionsPanel>

          <OptionsPanel>
            <button
              onClick={() => setAdvanced((a) => !a)}
              className="flex w-full items-center justify-between text-sm font-medium"
            >
              <span>Ajustes avanzados</span>
              <span className="text-xs text-muted-foreground">
                {advanced ? "Ocultar" : "Mostrar"}
              </span>
            </button>

            {advanced && (
              <div className="mt-4 space-y-3">
                <Slider
                  label="Brillo"
                  value={brightness}
                  onChange={setBrightness}
                />
                <Slider
                  label="Contraste"
                  value={contrast}
                  onChange={setContrast}
                />
                <Slider
                  label="Saturación"
                  value={saturation}
                  onChange={setSaturation}
                />
                <Slider
                  label="Nitidez"
                  value={sharpness}
                  onChange={setSharpness}
                />
                <Slider
                  label="Balance blancos"
                  value={whiteBalance}
                  onChange={setWhiteBalance}
                />
              </div>
            )}
          </OptionsPanel>

          <GenerateButton onClick={handleGenerate} label="Mejorar" />
        </>
      }
    />
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground tabular-nums">
          {value > 0 ? "+" : ""}
          {value}
        </span>
      </div>
      <input
        type="range"
        min={-50}
        max={50}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
