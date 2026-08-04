"use client";

import * as motionReact from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { DURATION, EASE_OUT } from "@/lib/motion";

const { AnimatePresence, motion, useReducedMotion } = motionReact;

/**
 * Quick, consistent transition between dashboard sections.
 *
 * Always the same direction (a small slide up plus a fade) so navigation feels
 * like one continuous surface. Kept to ~200ms — anything slower gets in the
 * way of someone who just wants to check a date.
 *
 * The wrapper element is always rendered, with the movement stripped rather
 * than the markup swapped, so server and client HTML stay identical.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldReduce = useReducedMotion() ?? false;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: shouldReduce ? 0 : 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: shouldReduce ? 0 : -4 }}
        transition={{ duration: shouldReduce ? DURATION.fast : DURATION.base, ease: EASE_OUT }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
