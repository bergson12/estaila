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
  labelFor,
} from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";

export function StagingClient({ plan }: { plan: string }) {
  const { runGenerate } = useStudio();
  const { t, locale } = useT();

  const DENSITIES = [
    { value: "MINIMAL", label: t.studio.densityMinimal, desc: t.studio.densityMinimalDesc },
    { value: "BALANCED", label: t.studio.densityBalanced, desc: t.studio.densityBalancedDesc },
    { value: "FULL", label: t.studio.densityFull, desc: t.studio.densityFullDesc },
  ] as const;

  const LUXURY_LEVELS = [
    { value: "ECONOMY", label: t.studio.luxuryEconomy, price: "$" },
    { value: "MID", label: t.studio.luxuryMid, price: "$$" },
    { value: "PREMIUM", label: t.studio.luxuryPremium, price: "$$$" },
    { value: "LUXURY", label: t.studio.luxuryLuxury, price: "$$$$" },
  ] as const;
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
          {t.studio.toolStagingTitle}
        </>
      }
      description={t.studio.stagingDescription}
      optionsPanel={
        <>
          <OptionsPanel title={t.studio.roomType}>
            <div className="grid grid-cols-2 gap-1.5">
              {ROOM_TYPES.map((r) => (
                <ChipButton
                  key={r.value}
                  active={roomType === r.value}
                  onClick={() => setRoomType(r.value)}
                  icon={r.icon}
                  label={labelFor(ROOM_TYPES, r.value, locale)}
                />
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title={t.studio.decorStyle}>
            <div className="grid grid-cols-2 gap-1.5">
              {STAGING_STYLES.map((s) => (
                <ChipButton
                  key={s.value}
                  active={style === s.value}
                  onClick={() => setStyle(s.value)}
                  icon={s.icon}
                  label={labelFor(STAGING_STYLES, s.value, locale)}
                />
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title={t.studio.luxuryLevel}>
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

          <OptionsPanel title={t.studio.lighting}>
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
                  <span>{labelFor(LIGHT_MOODS, m.value, locale)}</span>
                  <span className="text-[10px] opacity-70">
                    {(t.studio as Record<string, string>)[`lightDesc_${m.value}`] ?? m.desc}
                  </span>
                </button>
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title={t.studio.furnitureAmount}>
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

          <OptionsPanel title={t.studio.buyerTargetOptional}>
            <p className="mb-2 text-[10px] text-muted-foreground">
              {t.studio.buyerTargetHint}
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
                  label={labelFor(BUYER_TARGETS, b.value, locale)}
                />
              ))}
            </div>
          </OptionsPanel>

          <OptionsPanel title={t.studio.extraDetailsOptional}>
            <Textarea
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
              placeholder={t.studio.stagingExtraPlaceholder}
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
                  {t.studio.emptyFirst}
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.studio.emptyFirstDesc}
                </p>
              </div>
              <Switch checked={removeFirst} onCheckedChange={setRemoveFirst} />
            </label>
          </OptionsPanel>

          <GenerateButton onClick={handleGenerate} label={t.studio.furnishBtn} />
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
