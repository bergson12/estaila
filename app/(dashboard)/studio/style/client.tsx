"use client";

import { Palette } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { useApplySuggestion } from "@/components/studio/use-apply-suggestion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { STAGING_STYLES, labelFor } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";

export function StyleClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const { t, locale } = useT();
  const [style, setStyle] = useState<string>("MODERN");
  const [customPrompt, setCustomPrompt] = useState("");

  useApplySuggestion({ setStyle });

  return (
    <StudioShell
      plan={plan}
      title={
        <>
          <Palette className="h-5 w-5 text-primary" strokeWidth={1.75} />
          {t.studio.toolStyleTitle}
        </>
      }
      description={t.studio.styleDescription}
      optionsPanel={
        <>
          <OptionsPanel title={t.studio.newStyle}>
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
                  {labelFor(STAGING_STYLES, s.value, locale)}
                </button>
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title={t.studio.customPromptOptional}>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t.studio.addSpecificDetails}
            </Label>
            <Textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={t.studio.styleCustomPlaceholder}
              className="mt-2"
            />
          </OptionsPanel>

          <GenerateButton
            onClick={() => runGenerate({ style })}
            label={t.studio.changeStyleBtn}
          />
        </>
      }
    />
  );
}
