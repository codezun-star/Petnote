"use client";

import * as motionReact from "motion/react";
import type { ComponentProps, ReactNode } from "react";

import { fadeUp, interactive, staggerContainer, transitions } from "@/lib/motion";

const { motion, useReducedMotion } = motionReact;

/**
 * Pre-created motion elements.
 *
 * Built once at module scope rather than per render — `motion.create()` inside
 * a render returns a brand new component type each time, which remounts the
 * subtree and throws away its state.
 */
const MOTION_ELEMENTS = {
  div: motion.div,
  article: motion.article,
  section: motion.section,
} as const;

type MotionElement = keyof typeof MOTION_ELEMENTS;

/**
 * The small set of animation wrappers the app actually uses.
 *
 * Every one of them checks `useReducedMotion()` and degrades to a plain fade
 * (or nothing at all) rather than assuming motion is welcome.
 */

type FadeInProps = {
  children: ReactNode;
  className?: string;
  /** Upward travel in px. 0 gives a pure fade. */
  distance?: number;
  delay?: number;
  as?: MotionElement;
};

/** Fade + rise on mount. The default entrance for a page or section. */
export function FadeIn({ children, className, distance = 8, delay = 0, as = "div" }: FadeInProps) {
  const shouldReduce = useReducedMotion() ?? false;
  const Component = MOTION_ELEMENTS[as];

  return (
    <Component
      className={className}
      initial="hidden"
      animate="visible"
      variants={fadeUp(distance, shouldReduce)}
      transition={{ ...transitions.base, delay: shouldReduce ? 0 : delay }}
    >
      {children}
    </Component>
  );
}

/**
 * Staggered list container. Pair with `StaggerItem` children.
 *
 * Used for genuine load/add/remove events only — never on every re-render of a
 * data-dense table.
 */
export function StaggerList({
  children,
  className,
  stagger,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const shouldReduce = useReducedMotion() ?? false;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={staggerContainer(stagger, shouldReduce)}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  distance = 10,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const shouldReduce = useReducedMotion() ?? false;

  return (
    <motion.div className={className} variants={fadeUp(distance, shouldReduce)}>
      {children}
    </motion.div>
  );
}

/**
 * A list row that animates in and out with AnimatePresence.
 *
 * Height is animated alongside opacity here because collapsing the gap left by
 * a removed row is the whole point — a row that fades but leaves a hole reads
 * as a bug. Rows are the one place that trade-off is worth it.
 */
export function AnimatedListItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const shouldReduce = useReducedMotion() ?? false;

  return (
    <motion.div
      layout={!shouldReduce}
      className={className}
      initial={{ opacity: 0, y: shouldReduce ? 0 : -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        shouldReduce
          ? { opacity: 0 }
          : { opacity: 0, x: -12, height: 0, marginTop: 0, marginBottom: 0 }
      }
      transition={transitions.base}
    >
      {children}
    </motion.div>
  );
}

type InteractiveProps = ComponentProps<typeof motion.div> & {
  children: ReactNode;
  /** `subtle` for cards and default CTAs, `energetic` for upgrade prompts. */
  intent?: keyof typeof interactive;
};

/** Wraps a card or button in hover/tap feedback. */
export function Interactive({ children, intent = "subtle", ...props }: InteractiveProps) {
  const shouldReduce = useReducedMotion() ?? false;
  const preset = interactive[intent];

  return (
    <motion.div
      whileHover={shouldReduce ? undefined : preset.hover}
      whileTap={shouldReduce ? undefined : preset.tap}
      transition={transitions.fast}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export { motion, useReducedMotion };
export { AnimatePresence } from "motion/react";
