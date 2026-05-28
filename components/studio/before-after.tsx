"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * BeforeAfter — draggable slider comparing two images.
 * Pure DOM, no deps. Works on touch + pointer.
 */
export function BeforeAfter({
  beforeUrl,
  afterUrl,
  afterFilter,
  alt = "",
  className,
}: {
  beforeUrl: string;
  afterUrl: string;
  afterFilter?: string;
  alt?: string;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // 0..100
  const [dragging, setDragging] = useState(false);

  const updateFromPointer = useCallback((clientX: number) => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    function onMove(e: PointerEvent) {
      updateFromPointer(e.clientX);
    }
    function onUp() {
      setDragging(false);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, updateFromPointer]);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        // w-fit so the wrapper shrinks to the AFTER image's rendered box;
        // mx-auto centers it. max-w-full keeps it inside the panel.
        "relative mx-auto w-fit max-w-full overflow-hidden rounded-xl border border-border bg-muted select-none cursor-ew-resize",
        className
      )}
      onPointerDown={(e) => {
        setDragging(true);
        updateFromPointer(e.clientX);
      }}
      onDoubleClick={() => setPos(50)}
    >
      {/* AFTER — in normal flow, defines the container's box (width + height).
          Capped to viewport height; width follows aspect ratio. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt={alt}
        draggable={false}
        className="block max-h-[calc(100vh-16rem)] w-auto max-w-full object-contain"
        style={afterFilter ? { filter: afterFilter } : undefined}
      />

      {/* BEFORE — absolutely overlaid on the SAME box, same size as AFTER.
          We reveal only the left portion with clip-path so the image is
          clipped (never resized) — this keeps both frames pixel-aligned
          even when the AI output has a slightly different aspect ratio. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={beforeUrl}
        alt={alt}
        draggable={false}
        className="pointer-events-none absolute inset-0 block h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />

      {/* Divider handle */}
      <div
        className="pointer-events-none absolute bottom-0 top-0 w-px bg-white shadow-lg"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-black"
            >
              <path
                d="M4 3L1 7L4 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 3L13 7L10 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
        Antes
      </span>
      <span className="absolute right-3 top-3 rounded-md bg-primary/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
        Después
      </span>
    </div>
  );
}
