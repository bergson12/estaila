/**
 * Reusable motion variants for premium UI.
 * Avoid framer drag — use motion/react with simple variants.
 * All animations respect prefers-reduced-motion (motion handles this automatically when used with `useReducedMotion`).
 */
import type { Variants, Transition } from "motion/react";

export const spring: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 32,
  mass: 0.7,
};

export const springLoose: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 28,
  mass: 0.9,
};

export const ease: Transition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1], // ease-out-quart
};

// Page-level enter
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { ...ease, duration: 0.45 },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2 },
  },
};

// Stagger container for lists/grids
export const staggerContainer = (staggerChildren = 0.05): Variants => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren, delayChildren: 0.05 },
  },
});

// Item that fades + slides up (used inside stagger container)
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: spring },
};

// Scale fade (used for modal/dialog feel)
export const scaleFade: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: spring },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

// Subtle press feedback for buttons (use with whileTap)
export const tapShrink = { scale: 0.97 };
export const hoverLift = { y: -2, transition: spring };

// Glow ring (focus / active CTA halo)
export const glowVariants: Variants = {
  idle: { boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)" },
  pulse: {
    boxShadow: [
      "0 0 0 0 rgba(59, 130, 246, 0.35)",
      "0 0 0 12px rgba(59, 130, 246, 0)",
    ],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeOut" },
  },
};

// Success sparkle (used after AI generation)
export const sparkleVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: [0, 1, 0],
    scale: [0, 1.2, 0],
    transition: { duration: 0.9, ease: "easeOut" },
  },
};
