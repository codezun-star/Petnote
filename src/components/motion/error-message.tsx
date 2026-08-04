"use client";

import * as motionReact from "motion/react";
import { useEffect, type ReactNode } from "react";

import { transitions } from "@/lib/motion";

const { motion, useAnimate, useReducedMotion } = motionReact;

/**
 * Validation feedback that arrives rather than pops.
 *
 * Errors fade in and shake briefly — enough to catch the eye of someone who
 * just hit submit, without being alarming. The shake is driven imperatively
 * off `trigger`, which is the action's state object: `useActionState` hands
 * back a fresh object on every submission, so repeating the *same* mistake
 * still re-shakes rather than sitting there silently.
 *
 * Under reduced motion it is a plain fade with no travel.
 */
export function AnimatedFormMessage({
  children,
  trigger,
  variant = "error",
}: {
  children: ReactNode;
  trigger?: unknown;
  variant?: "error" | "success";
}) {
  const shouldReduce = useReducedMotion() ?? false;
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (shouldReduce || variant !== "error" || !scope.current) return;
    animate(scope.current, { x: [0, -6, 5, -3, 0] }, { duration: 0.35, ease: "easeOut" });
  }, [animate, scope, shouldReduce, trigger, variant]);

  return (
    <motion.div
      ref={scope}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.base}
    >
      {children}
    </motion.div>
  );
}
