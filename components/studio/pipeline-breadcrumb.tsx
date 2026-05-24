"use client";

import { ChevronRight, Camera, RotateCcw, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStudioPipeline, type PipelineStep } from "@/lib/stores/studio-pipeline";

const TOOL_HREF: Record<string, string> = {
  STAGING: "/studio/staging",
  DECLUTTER: "/studio/declutter",
  ENHANCE: "/studio/enhance",
  STYLE_CHANGE: "/studio/style",
  SKY: "/studio/sky",
  TWILIGHT: "/studio/twilight",
  POOL: "/studio/pool",
  LAWN: "/studio/lawn",
};

const TOOL_LABEL: Record<string, string> = {
  STAGING: "Staging",
  DECLUTTER: "Declutter",
  ENHANCE: "Mejorar",
  STYLE_CHANGE: "Estilo",
  SKY: "Cielo",
  TWILIGHT: "Atardecer",
  POOL: "Piscina",
  LAWN: "Césped",
};

export function PipelineBreadcrumb() {
  const router = useRouter();
  const { originalUrl, steps, currentStepIndex, revertTo, reset } =
    useStudioPipeline();

  if (!originalUrl) return null;

  function jumpTo(step: PipelineStep) {
    const href = TOOL_HREF[step.tool];
    if (href) router.push(href);
  }

  function handleReset() {
    if (steps.length === 0) {
      reset();
      return;
    }
    if (!confirm("¿Descartar el pipeline actual? Empezarás desde una foto nueva.")) return;
    reset();
    toast.success("Pipeline reiniciado");
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4 flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border bg-card/50 p-2 backdrop-blur-md"
    >
      <div className="flex shrink-0 items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary"></span>
        </span>
        Pipeline
      </div>

      {/* Original step */}
      <StepChip
        thumbnailUrl={originalUrl}
        label="Original"
        active={currentStepIndex === -1}
        icon={<Camera className="h-3 w-3" />}
        onClick={() => revertTo(-1)}
      />

      <AnimatePresence>
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.9, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex shrink-0 items-center gap-1.5"
          >
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
            <StepChip
              thumbnailUrl={step.outputUrl}
              label={TOOL_LABEL[step.tool] ?? step.tool}
              sublabel={typeof step.options?.style === "string" ? (step.options.style as string) : undefined}
              cssFilter={step.cssFilter}
              active={currentStepIndex === i}
              onClick={() => revertTo(i)}
              onJump={() => jumpTo(step)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="ml-auto flex shrink-0 items-center gap-1 pl-2">
        {steps.length > 0 && currentStepIndex > -1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => revertTo(-1)}
            title="Volver al original"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Original
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={handleReset}
          title="Descartar pipeline"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

function StepChip({
  thumbnailUrl,
  label,
  sublabel,
  cssFilter,
  active,
  icon,
  onClick,
  onJump,
}: {
  thumbnailUrl: string;
  label: string;
  sublabel?: string;
  cssFilter?: string;
  active: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
  onJump?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onDoubleClick={onJump}
      className={cn(
        "group flex shrink-0 items-center gap-2 rounded-lg border px-1.5 py-1 transition-all",
        active
          ? "border-primary/50 bg-primary/10 shadow-sm shadow-primary/10"
          : "border-border bg-card hover:border-foreground/20"
      )}
      title={onJump ? "Doble-click para abrir herramienta" : label}
    >
      <div className="relative h-7 w-7 overflow-hidden rounded-md bg-muted ring-1 ring-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
          style={cssFilter ? { filter: cssFilter } : undefined}
        />
      </div>
      <div className="hidden flex-col items-start pr-1 sm:flex">
        <span
          className={cn(
            "flex items-center gap-1 text-[11px] font-medium leading-tight",
            active ? "text-primary" : "text-foreground"
          )}
        >
          {icon}
          {label}
        </span>
        {sublabel && (
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {sublabel.toLowerCase()}
          </span>
        )}
      </div>
    </button>
  );
}
