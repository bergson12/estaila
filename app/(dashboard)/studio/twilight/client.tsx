"use client";

import { Sunset, TrendingUp } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

export function TwilightClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const { t } = useT();
  const [intensity, setIntensity] = useState<string>("GOLDEN");

  const INTENSITIES = [
    { value: "SUBTLE", label: t.studio.twilightSubtle, desc: t.studio.twilightSubtleDesc },
    { value: "GOLDEN", label: t.studio.twilightGolden, desc: t.studio.twilightGoldenDesc },
    { value: "DRAMATIC", label: t.studio.twilightDramatic, desc: t.studio.twilightDramaticDesc },
  ] as const;

  return (
    <StudioShell
      plan={plan}
      title={
        <>
          <Sunset className="h-5 w-5 text-primary" strokeWidth={1.75} />
          {t.studio.toolTwilightTitle}
        </>
      }
      description={t.studio.twilightDescription}
      optionsPanel={
        <>
          <OptionsPanel>
            <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium text-primary">
                  {t.studio.twilightClicksTitle}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {t.studio.twilightClicksDesc}
                </p>
              </div>
            </div>
          </OptionsPanel>

          <OptionsPanel title={t.studio.intensity}>
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
            label={t.studio.applyTwilightBtn}
          />
        </>
      }
    />
  );
}
