"use client";

import { Wand2, Zap } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

export function EnhanceClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const { t } = useT();
  const [preset, setPreset] = useState<string>("AUTO");

  const PRESETS = [
    { value: "AUTO", label: t.studio.enhanceAuto, desc: t.studio.enhanceAutoDesc },
    { value: "INTERIOR_DARK", label: t.studio.enhanceInteriorDark, desc: t.studio.enhanceInteriorDarkDesc },
    { value: "YELLOW_TONES", label: t.studio.enhanceYellowTones, desc: t.studio.enhanceYellowTonesDesc },
    { value: "PHONE_PHOTO", label: t.studio.enhancePhonePhoto, desc: t.studio.enhancePhonePhotoDesc },
    { value: "CLOUDY", label: t.studio.enhanceCloudy, desc: t.studio.enhanceCloudyDesc },
  ] as const;
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
          {t.studio.toolEnhanceTitle}
        </>
      }
      description={t.studio.enhanceDescription}
      optionsPanel={
        <>
          <OptionsPanel title={t.studio.preset}>
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
              <span>{t.studio.advancedAdjustments}</span>
              <span className="text-xs text-muted-foreground">
                {advanced ? t.studio.hide : t.studio.show}
              </span>
            </button>

            {advanced && (
              <div className="mt-4 space-y-3">
                <Slider
                  label={t.studio.brightness}
                  value={brightness}
                  onChange={setBrightness}
                />
                <Slider
                  label={t.studio.contrast}
                  value={contrast}
                  onChange={setContrast}
                />
                <Slider
                  label={t.studio.saturation}
                  value={saturation}
                  onChange={setSaturation}
                />
                <Slider
                  label={t.studio.sharpness}
                  value={sharpness}
                  onChange={setSharpness}
                />
                <Slider
                  label={t.studio.whiteBalance}
                  value={whiteBalance}
                  onChange={setWhiteBalance}
                />
              </div>
            )}
          </OptionsPanel>

          <GenerateButton onClick={handleGenerate} label={t.studio.enhanceBtn} />
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
