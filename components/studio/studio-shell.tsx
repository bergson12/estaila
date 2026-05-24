"use client";

import { motion } from "motion/react";
import { ToolNav } from "./tool-nav";
import { CanvasView } from "./canvas-view";
import { CreditsMeter } from "./credits-meter";
import { PipelineBreadcrumb } from "./pipeline-breadcrumb";
import { useStudio } from "./studio-context";

export function StudioShell({
  title,
  description,
  optionsPanel,
  plan,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  optionsPanel: React.ReactNode;
  plan: string;
}) {
  const { runGenerate, image } = useStudio();

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_1fr_20rem]">
        {/* Left: tool nav */}
        <ToolNav />

        {/* Center: canvas */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </motion.div>

          <PipelineBreadcrumb />

          <CanvasView onRegenerate={image ? () => runGenerate() : undefined} />
        </div>

        {/* Right: options */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          <CreditsMeter plan={plan} />
          {optionsPanel}
        </motion.div>
      </div>
    </div>
  );
}
