"use client";

import * as motionReact from "motion/react";
import type { ReactNode } from "react";

import { fadeUp, staggerContainer } from "@/lib/motion";

const { motion, useReducedMotion } = motionReact;

/**
 * Staggered entrance for the hero copy: badge, heading, subheading, CTAs,
 * each a beat after the last.
 */
export function HeroSequence({ children, className }: { children: ReactNode; className?: string }) {
  const shouldReduce = useReducedMotion() ?? false;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.08, shouldReduce)}
    >
      {children}
    </motion.div>
  );
}

export function HeroItem({ children, className }: { children: ReactNode; className?: string }) {
  const shouldReduce = useReducedMotion() ?? false;
  return (
    <motion.div className={className} variants={fadeUp(14, shouldReduce)}>
      {children}
    </motion.div>
  );
}
