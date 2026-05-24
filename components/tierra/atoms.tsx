"use client";

/**
 * TIERRA CARIBE — atomic primitives shared across marketing, portal & property landings.
 *
 * Design language: editorial cartographic, Caribbean tropical palette,
 * Fraunces serif display + Instrument Sans body + JetBrains Mono micro-labels.
 */

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

// ============================================================
// COORD — mono micro-label for coordinates / metadata
// ============================================================

export function Coord({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "tierra-mono inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.18em] opacity-70",
        className
      )}
    >
      {children}
    </span>
  );
}

// ============================================================
// SECTION LABEL — numbered chapter heading
// ============================================================

export function SectionLabel({
  n,
  label,
  total,
  className,
}: {
  n: string;
  label: string;
  total?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-3 border-b border-current/30 pb-2",
        className
      )}
    >
      <span className="tierra-mono text-[10px] font-medium uppercase tracking-[0.22em] opacity-60">
        {n}
        {total && (
          <>
            <span className="mx-1 opacity-50">/</span>
            <span className="opacity-50">{total}</span>
          </>
        )}
      </span>
      <span className="tierra-mono text-[10px] font-medium uppercase tracking-[0.22em]">
        {label}
      </span>
    </div>
  );
}

// ============================================================
// NORTH ARROW — compass rose decoration
// ============================================================

export function NorthArrow({
  size = 56,
  className,
  animate = true,
}: {
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      className={cn(animate && "tierra-compass", className)}
      aria-hidden
    >
      {/* outer circle */}
      <circle
        cx="28"
        cy="28"
        r="26"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.5"
      />
      <circle
        cx="28"
        cy="28"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.4"
        opacity="0.3"
      />
      {/* N arrow */}
      <path
        d="M28 6 L33 28 L28 24 L23 28 Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M28 6 L28 24"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.5"
      />
      {/* S arrow (thin) */}
      <path
        d="M28 50 L31 30 L28 32 L25 30 Z"
        fill="currentColor"
        opacity="0.3"
      />
      {/* E/W ticks */}
      <line
        x1="2"
        y1="28"
        x2="10"
        y2="28"
        stroke="currentColor"
        strokeWidth="0.4"
        opacity="0.4"
      />
      <line
        x1="46"
        y1="28"
        x2="54"
        y2="28"
        stroke="currentColor"
        strokeWidth="0.4"
        opacity="0.4"
      />
      <text
        x="28"
        y="14"
        textAnchor="middle"
        fontSize="6"
        fill="currentColor"
        fontFamily="var(--font-jetbrains-mono), monospace"
        opacity="0.7"
        fontWeight="600"
      >
        N
      </text>
    </svg>
  );
}

// ============================================================
// PALM FROND — divider decoration
// ============================================================

export function PalmFrond({
  size = 80,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size * 0.4}
      viewBox="0 0 200 80"
      className={className}
      aria-hidden
    >
      <path
        d="M 0 40 Q 50 40, 100 40 T 200 40"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
      {Array.from({ length: 16 }).map((_, i) => {
        const x = 12 + i * 12;
        const arch = Math.sin((i / 16) * Math.PI);
        const len = 12 + arch * 16;
        return (
          <g key={i} opacity="0.5">
            <line
              x1={x}
              y1={40}
              x2={x - 3}
              y2={40 - len}
              stroke="currentColor"
              strokeWidth="0.6"
            />
            <line
              x1={x}
              y1={40}
              x2={x + 3}
              y2={40 + len}
              stroke="currentColor"
              strokeWidth="0.6"
            />
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// WAVE DIVIDER
// ============================================================

export function WaveDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn("tierra-waves h-6 w-full", className)}
      aria-hidden
    />
  );
}

// ============================================================
// CONTOUR BG — topographic backdrop
// ============================================================

export function ContourBg({
  className,
  intensity = "default",
}: {
  className?: string;
  intensity?: "default" | "strong";
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 tierra-contour",
        intensity === "strong" && "opacity-100",
        className
      )}
      aria-hidden
    />
  );
}

// ============================================================
// EDGE TICKS — corner brackets for cards
// ============================================================

export function EdgeTicks({
  className,
  corners = "all",
}: {
  className?: string;
  corners?: "all" | "tl" | "tr" | "bl" | "br";
}) {
  const t = (pos: string) => (
    <span
      className={cn(
        "absolute h-3 w-3 border-current",
        pos === "tl" && "left-0 top-0 border-l border-t",
        pos === "tr" && "right-0 top-0 border-r border-t",
        pos === "bl" && "bottom-0 left-0 border-b border-l",
        pos === "br" && "bottom-0 right-0 border-b border-r"
      )}
    />
  );
  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden
    >
      {(corners === "all" || corners === "tl") && t("tl")}
      {(corners === "all" || corners === "tr") && t("tr")}
      {(corners === "all" || corners === "bl") && t("bl")}
      {(corners === "all" || corners === "br") && t("br")}
    </div>
  );
}

// ============================================================
// REVEAL — animated entrance
// ============================================================

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "span" | "p" | "h1" | "h2" | "h3";
}) {
  const reduced = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      initial={reduced ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className={className}
    >
      {children}
    </Comp>
  );
}

// ============================================================
// TYPED CARET — editorial blinking cursor
// ============================================================

export function Caret({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "tierra-caret ml-1 inline-block h-[0.9em] w-[2px] translate-y-[0.05em] bg-current",
        className
      )}
      aria-hidden
    />
  );
}

// ============================================================
// MINI MAP — abstract island contour decoration
// ============================================================

export function MiniMap({
  size = 100,
  seed = 0,
  className,
}: {
  size?: number;
  seed?: number;
  className?: string;
}) {
  // Pseudo-random island shape (stable per seed)
  const r = (i: number) => {
    const x = Math.sin(seed * 9999 + i * 1.7) * 10000;
    return x - Math.floor(x);
  };
  const points: string[] = [];
  const cx = 50,
    cy = 50;
  const n = 12;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    const radius = 22 + r(i) * 14;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
    >
      {/* sea waves */}
      {[0, 1, 2].map((i) => (
        <circle
          key={`w${i}`}
          cx={cx}
          cy={cy}
          r={42 - i * 6}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.3"
          opacity={0.15 - i * 0.04}
        />
      ))}
      {/* island contour rings */}
      {[0, 1, 2].map((i) => (
        <polygon
          key={`c${i}`}
          points={points
            .map((p) => {
              const [x, y] = p.split(",").map(Number);
              const t = 1 - i * 0.18;
              return `${cx + (x - cx) * t},${cy + (y - cy) * t}`;
            })
            .join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity={0.35 + i * 0.15}
        />
      ))}
      {/* center dot */}
      <circle cx={cx} cy={cy} r="1" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

// ============================================================
// CHAPTER NUMBER — big editorial italic
// ============================================================

export function ChapterNumber({
  n,
  className,
}: {
  n: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "tierra-display block text-[var(--tierra-primary)] tierra-chapter",
        className
      )}
    >
      {n}
    </span>
  );
}

// ============================================================
// SUN / MOON — decoration (light/dark)
// ============================================================

export function Sun({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden
    >
      <circle cx="20" cy="20" r="8" fill="currentColor" opacity="0.9" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x1 = 20 + Math.cos(a) * 12;
        const y1 = 20 + Math.sin(a) * 12;
        const x2 = 20 + Math.cos(a) * 18;
        const y2 = 20 + Math.sin(a) * 18;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.7"
          />
        );
      })}
    </svg>
  );
}

// ============================================================
// HOOK: typewriter
// ============================================================

export function useTypewriter(text: string, speedMs = 30, startDelay = 0) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    let i = 0;
    const timer = setTimeout(() => {
      const id = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(id);
      }, speedMs);
    }, startDelay);
    return () => clearTimeout(timer);
  }, [text, speedMs, startDelay]);
  return out;
}

// ============================================================
// STYLE — easy CSS var helper
// ============================================================

export const tierraVar = (name: string): CSSProperties => ({
  color: `var(--tierra-${name})`,
});
