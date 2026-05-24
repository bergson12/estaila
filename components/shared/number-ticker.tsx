"use client";

import { useEffect, useRef, useState } from "react";

/**
 * NumberTicker — counts up from 0 to `value` on mount.
 * Uses requestAnimationFrame for smooth 60fps animation.
 * Respects prefers-reduced-motion.
 */
export function NumberTicker({
  value,
  duration = 800,
  format,
  className,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      setCurrent(value);
      return;
    }

    const startTime = performance.now();
    const startValue = 0;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(startValue + (value - startValue) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setCurrent(value);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const rendered = format
    ? format(current)
    : Math.round(current).toLocaleString("es");

  return <span className={className}>{rendered}</span>;
}
