"use client";

import { Sun, CloudSun, CloudRain, Palmtree } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

export function SkyClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const { t } = useT();
  const [mode, setMode] = useState<string>("CLEAR");

  const MODES = [
    {
      value: "CLEAR",
      label: t.studio.skyClear,
      description: t.studio.skyClearDesc,
      icon: Sun,
    },
    {
      value: "TROPICAL",
      label: t.studio.skyTropical,
      description: t.studio.skyTropicalDesc,
      icon: Palmtree,
    },
    {
      value: "SUNSET",
      label: t.studio.skySunset,
      description: t.studio.skySunsetDesc,
      icon: CloudSun,
    },
    {
      value: "DRAMATIC",
      label: t.studio.skyDramatic,
      description: t.studio.skyDramaticDesc,
      icon: CloudRain,
    },
  ] as const;

  return (
    <StudioShell
      plan={plan}
      title={
        <>
          <Sun className="h-5 w-5 text-primary" strokeWidth={1.75} />
          {t.studio.toolSkyTitle}
        </>
      }
      description={t.studio.skyDescription}
      optionsPanel={
        <>
          <OptionsPanel title={t.studio.skyType}>
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

          <OptionsPanel title={t.studio.tip}>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t.studio.skyTip}
            </p>
          </OptionsPanel>

          <GenerateButton
            onClick={() => runGenerate({ skyMode: mode as "CLEAR" | "SUNSET" | "DRAMATIC" | "TROPICAL" })}
            label={t.studio.changeSkyBtn}
          />
        </>
      }
    />
  );
}
