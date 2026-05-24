"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * PageTransition wraps page content with a refined enter animation:
 *   - fade + slight upward translate + de-blur on enter
 *   - tight exit (fade + small slide up)
 *   - keys on pathname so transitions fire on route change
 *   - respects reduced-motion (no animation when user prefers reduced motion)
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
        animate={{
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: 0.42,
            ease: [0.22, 1, 0.36, 1],
            opacity: { duration: 0.3 },
            filter: { duration: 0.25 },
          },
        }}
        exit={{
          opacity: 0,
          y: -4,
          transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
        }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
