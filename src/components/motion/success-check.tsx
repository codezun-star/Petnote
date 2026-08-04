"use client";

import * as motionReact from "motion/react";

const { motion, useReducedMotion } = motionReact;

/**
 * Brief confirmation mark drawn in the fresh accent, shown after a successful
 * save. The stroke draws itself in ~300ms; under reduced motion it simply
 * appears.
 */
export function SuccessCheck({ className }: { className?: string }) {
  const shouldReduce = useReducedMotion() ?? false;

  return (
    <motion.span
      className={className}
      initial={shouldReduce ? false : { scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <motion.path
          d="M4.5 12.5 9.5 17.5 19.5 6.5"
          stroke="var(--brand-fresh)"
          initial={shouldReduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: shouldReduce ? 0 : 0.06 }}
        />
      </svg>
    </motion.span>
  );
}
