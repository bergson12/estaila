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

type StudioImage = { url: string; filename?: string };
type StudioResult = {
  generationId: string;
  outputUrl: string;
  cssFilter?: string;
  processingTimeMs: number;
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
  const pipeline = useStudioPipeline();
  const [hydrated, setHydrated] = useState(false);
  const [image, setImageState] = useState<StudioImage | null>(
    initialImage ?? null
  );
  const [result, setResult] = useState<StudioResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [credits, setCredits] = useState(initialCredits);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);

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
        toast.error("Sube una foto primero");
        return;
      }
      if (credits < cost) {
        toast.error(
          `Necesitas ${cost} crédito${cost > 1 ? "s" : ""}. Compra más en /pricing.`
        );
        return;
      }
      setIsGenerating(true);
      setResult(null);
      try {
        const out = await generate({
          tool,
          inputUrl: image.url,
          options: {
            ...(options ?? {}),
            ...(maskDataUrl ? { maskDataUrl } : {}),
          } as ProcessOptions,
        });
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
          toast.warning("Preview con filtro (Gemini sin cuota)", {
            description:
              "Activa billing en aistudio.google.com para imagen IA real. Crédito usado igual.",
            duration: 6000,
          });
        } else {
          toast.success(
            `Listo en ${Math.round(out.processingTimeMs / 100) / 10}s`,
            { description: `${cost} crédito${cost > 1 ? "s" : ""} usado${cost > 1 ? "s" : ""}` }
          );
        }
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setIsGenerating(false);
      }
    },
    [image, credits, cost, tool, toolLabel, pipeline, router, maskDataUrl]
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
