"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type PipelineStep = {
  id: string;
  tool: string; // AIToolName
  toolLabel: string;
  inputUrl: string;
  outputUrl: string;
  cssFilter?: string;
  options?: Record<string, unknown>;
  createdAt: number;
};

type PipelineState = {
  /** Pipeline ID — used to scope multiple pipelines if needed */
  pipelineId: string;
  /** The original uploaded image URL (step 0 input) */
  originalUrl: string | null;
  /** Ordered list of generation steps applied */
  steps: PipelineStep[];
  /** Index of the step considered "current" (default = last) */
  currentStepIndex: number;

  /** Get the URL of the current working image (output of currentStepIndex or original) */
  getCurrentImageUrl: () => string | null;
  /** Set/reset original image (clears all steps) */
  setOriginal: (url: string) => void;
  /** Push a new step (becomes current) */
  pushStep: (step: Omit<PipelineStep, "id" | "createdAt">) => void;
  /** Revert to a previous step (truncates later steps) */
  revertTo: (index: number) => void;
  /** Clear everything */
  reset: () => void;
};

function newPipelineId() {
  return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useStudioPipeline = create<PipelineState>()(
  persist(
    (set, get) => ({
      pipelineId: newPipelineId(),
      originalUrl: null,
      steps: [],
      currentStepIndex: -1,

      getCurrentImageUrl: () => {
        const s = get();
        if (s.currentStepIndex >= 0 && s.steps[s.currentStepIndex]) {
          return s.steps[s.currentStepIndex].outputUrl;
        }
        return s.originalUrl;
      },

      setOriginal: (url) =>
        set({
          pipelineId: newPipelineId(),
          originalUrl: url,
          steps: [],
          currentStepIndex: -1,
        }),

      pushStep: (step) => {
        const id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        const full: PipelineStep = {
          ...step,
          id,
          createdAt: Date.now(),
        };
        set((state) => {
          // If we're not at the tail, truncate forward history (like git)
          const base =
            state.currentStepIndex >= 0
              ? state.steps.slice(0, state.currentStepIndex + 1)
              : state.steps;
          const nextSteps = [...base, full];
          return {
            steps: nextSteps,
            currentStepIndex: nextSteps.length - 1,
          };
        });
      },

      revertTo: (index) =>
        set((state) => {
          if (index < -1 || index >= state.steps.length) return state;
          return { currentStepIndex: index };
        }),

      reset: () =>
        set({
          pipelineId: newPipelineId(),
          originalUrl: null,
          steps: [],
          currentStepIndex: -1,
        }),
    }),
    {
      name: "studio-pipeline",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : undefined!
      ),
      // Only persist these fields, no functions
      partialize: (state) => ({
        pipelineId: state.pipelineId,
        originalUrl: state.originalUrl,
        steps: state.steps,
        currentStepIndex: state.currentStepIndex,
      }),
    }
  )
);
