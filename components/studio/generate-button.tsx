"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudio } from "./studio-context";
import { useT } from "@/lib/i18n/provider";

export function GenerateButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label?: string;
}) {
  const { isGenerating, image, cost, credits } = useStudio();
  const { t } = useT();
  const disabled = !image || isGenerating || credits < cost;

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="h-11 w-full text-sm"
      size="lg"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t.studio.generating}
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          {label ?? t.studio.generate} ({cost} {cost > 1 ? t.studio.creditWordPlural : t.studio.creditWord})
        </>
      )}
    </Button>
  );
}
