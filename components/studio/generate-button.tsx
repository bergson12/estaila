"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudio } from "./studio-context";

export function GenerateButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label?: string;
}) {
  const { isGenerating, image, cost, credits } = useStudio();
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
          Generando...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          {label ?? "Generar"} ({cost} crédito{cost > 1 ? "s" : ""})
        </>
      )}
    </Button>
  );
}
