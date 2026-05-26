"use client";

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
    <div className="w-full">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[12rem_minmax(0,1fr)_18rem]">
        {/* Left: tool nav — sticky on desktop, compact enough to never need scroll */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <ToolNav />
        </div>

        {/* Center: canvas — never overflows the column */}
        <div className="min-w-0 space-y-3">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <PipelineBreadcrumb />

          <CanvasView onRegenerate={image ? () => runGenerate() : undefined} />
        </div>

        {/* Right: options — sticky panel, independent scroll */}
        <div className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          <div className="space-y-3">
            <CreditsMeter plan={plan} />
            {optionsPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
