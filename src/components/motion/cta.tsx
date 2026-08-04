"use client";

import * as motionReact from "motion/react";
import type { ReactNode } from "react";

import { interactive, transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

const { motion, useReducedMotion } = motionReact;

/**
 * Hover/tap feedback for a call-to-action.
 *
 * `energetic` is reserved for conversion points — the "Upgrade to Pro"
 * buttons — which lift slightly further than a standard CTA. Everything else
 * uses `subtle`.
 */
export function AnimatedCta({
  children,
  intent = "subtle",
  className,
}: {
  children: ReactNode;
  intent?: "subtle" | "energetic";
  className?: string;
}) {
  const shouldReduce = useReducedMotion() ?? false;
  const preset = interactive[intent];

  return (
    <motion.div
      className={cn("inline-flex", className)}
      whileHover={shouldReduce ? undefined : preset.hover}
      whileTap={shouldReduce ? undefined : preset.tap}
      transition={transitions.fast}
    >
      {children}
    </motion.div>
  );
}

/** Card that lifts on hover — pricing cards, blog cards. */
export function HoverLift({
  children,
  className,
  /** Adds a deeper shadow at rest so the lift has something to grow from. */
  withShadow = true,
}: {
  children: ReactNode;
  className?: string;
  withShadow?: boolean;
}) {
  const shouldReduce = useReducedMotion() ?? false;

  return (
    <motion.div
      className={cn(
        "h-full rounded-xl",
        withShadow && "transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(23,55,92,0.45)]",
        className,
      )}
      whileHover={shouldReduce ? undefined : { y: -6, scale: 1.01 }}
      transition={transitions.fast}
    >
      {children}
    </motion.div>
  );
}
