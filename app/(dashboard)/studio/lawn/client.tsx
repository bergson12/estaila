"use client";

import { Trees } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

export function LawnClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const { t } = useT();
  const [styleVar, setStyleVar] = useState<string>("LUSH");

  const STYLES = [
    { value: "MANICURED", label: t.studio.lawnManicured, desc: t.studio.lawnManicuredDesc },
    { value: "LUSH", label: t.studio.lawnLush, desc: t.studio.lawnLushDesc },
    { value: "TROPICAL", label: t.studio.lawnTropical, desc: t.studio.lawnTropicalDesc },
  ] as const;

  return (
    <StudioShell
      plan={plan}
      title={
        <>
          <Trees className="h-5 w-5 text-primary" strokeWidth={1.75} />
          {t.studio.toolLawnTitle}
        </>
      }
      description={t.studio.lawnDescription}
      optionsPanel={
        <>
          <OptionsPanel title={t.studio.gardenStyle}>
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

          <OptionsPanel title={t.studio.result}>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• {t.studio.lawnRes1}</li>
              <li>• {t.studio.lawnRes2}</li>
              <li>• {t.studio.lawnRes3}</li>
            </ul>
          </OptionsPanel>

          <GenerateButton
            onClick={() => runGenerate({ preset: styleVar })}
            label={t.studio.lawnBtn}
          />
        </>
      }
    />
  );
}
