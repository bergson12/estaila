"use client";

import {
  Image as ImageIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { UploadZone } from "./upload-zone";
import { BeforeAfter } from "./before-after";
import { PhotoAnalysis } from "./photo-analysis";
import { PostActions } from "./post-actions";
import { useStudio } from "./studio-context";

export function CanvasView({
  onRegenerate,
}: {
  onRegenerate?: () => void;
}) {
  const { image, result, isGenerating, reset } = useStudio();

  if (!image) {
    return (
      <div className="space-y-3">
        <UploadZone />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PhotoAnalysis imageUrl={image.url} />

      <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative"
            >
              <BeforeAfter
                beforeUrl={image.url}
                afterUrl={result.outputUrl}
                afterFilter={result.cssFilter}
              />
              {/* Sparkle burst on reveal */}
              <SparkleBurst />
            </motion.div>
          ) : (
            <motion.div
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                className="mx-auto block max-h-[calc(100vh-16rem)] w-auto object-contain"
              />
              <AnimatePresence>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm"
                  >
                    <ProcessingAnimation />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          {result ? (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1.5"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              Listo · {(result.processingTimeMs / 1000).toFixed(1)}s
            </motion.span>
          ) : isGenerating ? (
            "Procesando..."
          ) : (
            "Lista para generar"
          )}
        </div>

        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <PostActions
              generationId={result.generationId}
              outputUrl={result.outputUrl}
              onRegenerate={onRegenerate}
              onReset={reset}
              isGenerating={isGenerating}
            />
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

function ProcessingAnimation() {
  return (
    <>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="relative h-12 w-12"
      >
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary" />
      </motion.div>
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="space-y-1 text-center"
      >
        <p className="text-sm font-medium">Generando...</p>
        <p className="text-xs text-muted-foreground">
          La IA está trabajando en tu foto
        </p>
      </motion.div>
    </>
  );
}

function SparkleBurst() {
  const sparkles = Array.from({ length: 8 });
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {sparkles.map((_, i) => {
        const angle = (i / sparkles.length) * Math.PI * 2;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              x: Math.cos(angle) * 80,
              y: Math.sin(angle) * 80,
            }}
            transition={{
              duration: 0.9,
              ease: "easeOut",
              delay: 0.15,
            }}
            className="absolute"
          >
            <Sparkles className="h-3 w-3 text-primary" />
          </motion.div>
        );
      })}
    </div>
  );
}
