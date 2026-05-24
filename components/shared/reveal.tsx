"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Reveal — fade + slide-up when element enters viewport.
 * Use for section/card reveal on scroll.
 *
 * Usage:
 *   <Reveal>...</Reveal>
 *   <Reveal delay={0.1} y={20}>...</Reveal>
 *   <Reveal as="ul">...</Reveal>
 */
export function Reveal({
  children,
  delay = 0,
  duration = 0.5,
  y = 14,
  once = true,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
  className?: string;
  as?: "div" | "span" | "p" | "h1" | "h2" | "h3" | "section" | "article" | "ul";
}) {
  const reduced = useReducedMotion();
  const Comp = motion[Tag] as typeof motion.div;
  return (
    <Comp
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-40px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </Comp>
  );
}

/**
 * Stagger — container that staggers child animations.
 * Use with <StaggerItem> children.
 */
export function Stagger({
  children,
  delayChildren = 0.05,
  staggerChildren = 0.06,
  className,
}: {
  children: ReactNode;
  delayChildren?: number;
  staggerChildren?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        visible: { transition: { delayChildren, staggerChildren } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  y = 12,
  className,
}: {
  children: ReactNode;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
