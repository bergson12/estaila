"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PropertyGallery({
  photos,
  title,
}: {
  photos: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl border border-border bg-card/30">
        <div className="text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">Sin fotos aún</p>
        </div>
      </div>
    );
  }

  const main = photos[active];

  return (
    <>
      <div className="space-y-2">
        {/* Hero */}
        <button
          onClick={() => setLightbox(true)}
          className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={main}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
          {photos.length > 1 && (
            <span className="absolute bottom-3 right-3 rounded-md bg-background/70 px-2 py-1 text-xs backdrop-blur-md">
              {active + 1} / {photos.length}
            </span>
          )}
        </button>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="grid grid-cols-6 gap-2">
            {photos.slice(0, 6).map((url, i) => (
              <button
                key={url + i}
                onClick={() => setActive(i)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-md border-2 bg-muted transition-all",
                  active === i
                    ? "border-primary"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                {i === 5 && photos.length > 6 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-semibold text-white">
                    +{photos.length - 6}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-white/10 hover:text-white"
            onClick={() => setLightbox(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) => (a - 1 + photos.length) % photos.length);
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) => (a + 1) % photos.length);
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={main}
            alt={title}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
