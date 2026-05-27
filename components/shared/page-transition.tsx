"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * PageTransition — fade-in only, no exit animation.
 *
 * Previous version used AnimatePresence mode="wait" which holds the OLD
 * content while exit plays, then mounts new. With Next 16 RSC streaming
 * this could leave the user staring at empty content when a route is slow
 * to hydrate (the old DOM was already torn down by AnimatePresence). Now
 * we only animate the entry, so the new page is always visible immediately.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
      }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
