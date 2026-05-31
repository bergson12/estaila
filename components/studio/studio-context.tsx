"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AIToolName, ProcessOptions } from "@/lib/ai/types";
import { generate } from "@/lib/actions/ai";
import { useStudioPipeline } from "@/lib/stores/studio-pipeline";
import { useT } from "@/lib/i18n/provider";

type StudioImage = { url: string; filename?: string };
type StudioResult = {
  generationId: string;
  outputUrl: string;
  cssFilter?: string;
  processingTimeMs: number;
};

/** Subset of PhotoAnalysis that the sidebar may auto-apply to its state. */
export type StudioSuggestion = {
  roomType: string; // raw label from analysis, e.g. "Sala"
  suggestedTool: string; // STAGING / ENHANCE / ...
  suggestedStyle: string | null; // MODERN / CARIBENO / ...
  buyerTarget: string | null; // "Familia con niños" / ...
  appliedAt: number; // bumps each time, so consumer can re-react
};

type StudioContextValue = {
  tool: AIToolName;
  toolLabel: string;
  cost: number;
  image: StudioImage | null;
  setImage: (img: StudioImage | null) => void;
  result: StudioResult | null;
  isGenerating: boolean;
  runGenerate: (options?: ProcessOptions) => Promise<void>;
  reset: () => void;
  credits: number;
  setCredits: (n: number) => void;
  /** True when the input image comes from a prior pipeline step */
  fromPipeline: boolean;
  /** Optional brush-painted mask (data URL, white-on-black PNG) restricting the AI's effect zone. */
  maskDataUrl: string | null;
  setMaskDataUrl: (m: string | null) => void;
  /** Reference StylePreset id (admin library) to guide style. */
  referenceId: string | null;
  setReferenceId: (id: string | null) => void;
  /** Latest IA analysis suggestion. PhotoAnalysis writes here; sidebar reads. */
  suggestion: StudioSuggestion | null;
  setSuggestion: (s: StudioSuggestion | null) => void;
};

const Ctx = createContext<StudioContextValue | null>(null);

export function StudioProvider({
  tool,
  toolLabel,
  cost,
  initialCredits,
  initialImage,
  children,
}: {
  tool: AIToolName;
  toolLabel?: string;
  cost: number;
  initialCredits: number;
  initialImage?: StudioImage | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const { t } = useT();
  const pipeline = useStudioPipeline();
  const [hydrated, setHydrated] = useState(false);
  const [image, setImageState] = useState<StudioImage | null>(
    initialImage ?? null
  );
  const [result, setResult] = useState<StudioResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [credits, setCredits] = useState(initialCredits);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<StudioSuggestion | null>(null);

  // After mount, hydrate from pipeline store
  useEffect(() => {
    setHydrated(true);
    if (initialImage?.url) {
      // External link with ?photoUrl= — set as pipeline origin (fresh start)
      pipeline.setOriginal(initialImage.url);
      setImageState({ url: initialImage.url });
    } else {
      // Try to read current image from pipeline (came from another tool)
      const current = pipeline.getCurrentImageUrl();
      if (current) {
        setImageState({ url: current });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fromPipeline =
    hydrated &&
    pipeline.steps.length > 0 &&
    image?.url === pipeline.getCurrentImageUrl() &&
    image?.url !== pipeline.originalUrl;

  // Handle user uploading a brand-new image: reset pipeline
  const setImage = useCallback(
    (img: StudioImage | null) => {
      if (img) {
        // Fresh upload — start a new pipeline
        pipeline.setOriginal(img.url);
        setImageState(img);
        setResult(null);
      } else {
        setImageState(null);
        setResult(null);
      }
    },
    [pipeline]
  );

  const runGenerate = useCallback(
    async (options?: ProcessOptions) => {
      if (!image) {
        toast.error(t.studio.toastUploadFirst);
        return;
      }
      if (credits < cost) {
        toast.error(
          `${t.studio.toastNeedCreditsPrefix} ${cost} ${cost > 1 ? t.studio.creditWordPlural : t.studio.creditWord}. ${t.studio.toastNeedCreditsSuffix}`
        );
        return;
      }
      setIsGenerating(true);
      setResult(null);
      try {
        // Send original pipeline anchor when we're past step 0, so Gemini
        // can use it as the immutable architectural reference.
        const pipelineOriginal = pipeline.originalUrl;
        const originalUrl =
          pipelineOriginal && pipelineOriginal !== image.url
            ? pipelineOriginal
            : undefined;

        const out = await generate({
          tool,
          inputUrl: image.url,
          options: {
            ...(options ?? {}),
            ...(maskDataUrl ? { maskDataUrl } : {}),
            ...(originalUrl ? { originalUrl } : {}),
            ...(referenceId ? { referenceId } : {}),
          } as ProcessOptions,
        });

        if (!out.ok) {
          // Show the real error message (not the redacted RSC one)
          toast.error(out.error, { duration: 10000 });
          return;
        }

        setResult({
          generationId: out.id,
          outputUrl: out.outputUrl,
          cssFilter: out.cssFilter,
          processingTimeMs: out.processingTimeMs,
        });
        setCredits(out.remainingCredits);
        // Push step into pipeline
        pipeline.pushStep({
          tool,
          toolLabel: toolLabel ?? tool,
          inputUrl: image.url,
          outputUrl: out.outputUrl,
          cssFilter: out.cssFilter,
          options: options as Record<string, unknown> | undefined,
        });
        if (out.fallbackUsed === "mock") {
          toast.warning(t.studio.toastMockTitle, {
            description: t.studio.toastMockDesc,
            duration: 6000,
          });
        } else {
          toast.success(
            `${t.studio.toastReadyIn} ${Math.round(out.processingTimeMs / 100) / 10}s`,
            { description: `${cost} ${cost > 1 ? t.studio.creditsUsedPlural : t.studio.creditsUsed}` }
          );
        }
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setIsGenerating(false);
      }
    },
    [image, credits, cost, tool, toolLabel, pipeline, router, maskDataUrl, referenceId]
  );

  const reset = useCallback(() => {
    setImageState(null);
    setResult(null);
    pipeline.reset();
  }, [pipeline]);

  return (
    <Ctx.Provider
      value={{
        tool,
        toolLabel: toolLabel ?? tool,
        cost,
        image,
        setImage,
        result,
        isGenerating,
        runGenerate,
        reset,
        credits,
        setCredits,
        fromPipeline,
        maskDataUrl,
        setMaskDataUrl,
        referenceId,
        setReferenceId,
        suggestion,
        setSuggestion,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStudio must be used inside <StudioProvider>");
  return ctx;
}
