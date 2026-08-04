"use client";

import * as motionReact from "motion/react";
import type { ReactNode } from "react";
import { useRef } from "react";

const { motion, useReducedMotion, useScroll, useTransform } = motionReact;

/**
 * Very restrained parallax on the hero mock: it drifts a little slower than
 * the page as you scroll away.
 *
 * The DOM structure is identical whether or not motion is reduced — only the
 * transform range changes. Branching the markup instead would produce a
 * server/client hydration mismatch, because `useReducedMotion()` reads the
 * media query on the client and always resolves false during SSR.
 */
export function HeroParallax({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, shouldReduce ? 0 : 48]);

  return (
    <div ref={ref}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
