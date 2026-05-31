"use client";

import { Eraser, Trash2, User, Briefcase, Brush, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import { OptionsPanel } from "@/components/studio/options-panel";
import { GenerateButton } from "@/components/studio/generate-button";
import { useStudio } from "@/components/studio/studio-context";
import { MaskBrush } from "@/components/studio/mask-brush";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

export function DeclutterClient({ plan }: { plan: string }) {
  const { runGenerate, image, maskDataUrl, setMaskDataUrl } = useStudio();
  const { t } = useT();
  const [mode, setMode] = useState<"AUTO" | "FURNITURE" | "PEOPLE" | "PERSONAL">(
    "AUTO"
  );
  const [brushOpen, setBrushOpen] = useState(false);

  const MODES = [
    {
      value: "AUTO",
      label: t.studio.declutterAuto,
      description: t.studio.declutterAutoDesc,
      icon: Eraser,
    },
    {
      value: "FURNITURE",
      label: t.studio.declutterFurniture,
      description: t.studio.declutterFurnitureDesc,
      icon: Trash2,
    },
    {
      value: "PEOPLE",
      label: t.studio.declutterPeople,
      description: t.studio.declutterPeopleDesc,
      icon: User,
    },
    {
      value: "PERSONAL",
      label: t.studio.declutterPersonal,
      description: t.studio.declutterPersonalDesc,
      icon: Briefcase,
    },
  ] as const;

  return (
    <>
      <StudioShell
        plan={plan}
        title={
          <>
            <Eraser className="h-5 w-5 text-primary" strokeWidth={1.75} />
            {t.studio.toolDeclutterTitle}
          </>
        }
        description={t.studio.declutterDescription}
        optionsPanel={
          <>
            <OptionsPanel title={t.studio.whatToRemove}>
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

            <OptionsPanel title={t.studio.preciseSelectionOptional}>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                {t.studio.preciseSelectionHintBefore}{" "}
                <strong>{t.studio.preciseSelectionHintStrong}</strong>{" "}
                {t.studio.preciseSelectionHintAfter}
              </p>
              <button
                type="button"
                disabled={!image}
                onClick={() => setBrushOpen(true)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left text-sm font-medium transition-all",
                  maskDataUrl
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                    : "border-border bg-card/50 hover:border-primary/30 hover:bg-primary/5",
                  !image && "cursor-not-allowed opacity-50"
                )}
              >
                <span className="flex items-center gap-2">
                  {maskDataUrl ? (
                    <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                  ) : (
                    <Brush className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  )}
                  {maskDataUrl ? t.studio.selectionActiveEdit : t.studio.magicBrush}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {maskDataUrl ? t.studio.tapToAdjust : t.studio.tapToOpen}
                </span>
              </button>
              {maskDataUrl && (
                <button
                  type="button"
                  onClick={() => setMaskDataUrl(null)}
                  className="mt-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.studio.clearSelection}
                </button>
              )}
            </OptionsPanel>

            <OptionsPanel title={t.studio.tip}>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t.studio.declutterTip}
              </p>
            </OptionsPanel>

            <GenerateButton
              onClick={() => runGenerate({ declutterMode: mode })}
              label={t.studio.cleanBtn}
            />
          </>
        }
      />
      {brushOpen && image && (
        <MaskBrush
          imageUrl={image.url}
          initialMask={maskDataUrl}
          onClose={() => setBrushOpen(false)}
          onConfirm={(mask) => {
            setMaskDataUrl(mask);
            setBrushOpen(false);
          }}
        />
      )}
    </>
  );
}
