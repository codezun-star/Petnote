import type { Transition, Variants } from "motion/react";

/**
 * Shared motion vocabulary.
 *
 * Everything animated in Petnote pulls its timing and easing from here so the
 * whole app moves with one personality: calm, quick, and never in the way of
 * someone trying to check a vaccine date.
 *
 * Only `transform` and `opacity` are animated — both are GPU-composited, so
 * nothing here triggers layout.
 */

/** Standard ease-out. One curve for the whole app rather than per-component taste. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Slightly softer curve for elements leaving the screen. */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const DURATION = {
  /** Hover, tap, colour changes. */
  fast: 0.15,
  /** The default for UI transitions: list items, dialogs, page changes. */
  base: 0.22,
  /** Slightly weightier — dialogs, larger surfaces. */
  medium: 0.3,
  /** One-time narrative moments on the landing page only. */
  reveal: 0.45,
} as const;

/** Stagger between siblings in a list or hero sequence. */
export const STAGGER = 0.06;

export const transitions = {
  fast: { duration: DURATION.fast, ease: EASE_OUT },
  base: { duration: DURATION.base, ease: EASE_OUT },
  medium: { duration: DURATION.medium, ease: EASE_OUT },
  reveal: { duration: DURATION.reveal, ease: EASE_OUT },
} satisfies Record<string, Transition>;

/**
 * Fade + small upward motion. The workhorse entrance.
 *
 * `reduced` collapses it to a plain fade with no travel — the guidance for
 * prefers-reduced-motion is to remove movement, not all feedback.
 */
export function fadeUp(distance = 8, reduced = false): Variants {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduced ? { duration: DURATION.fast } : transitions.base,
    },
    exit: {
      opacity: 0,
      y: reduced ? 0 : -distance,
      transition: reduced ? { duration: DURATION.fast } : { duration: DURATION.fast, ease: EASE_IN_OUT },
    },
  };
}

/** Parent variant that walks its children in one after another. */
export function staggerContainer(stagger = STAGGER, reduced = false): Variants {
  return {
    hidden: {},
    visible: {
      transition: reduced ? {} : { staggerChildren: stagger, delayChildren: 0.04 },
    },
  };
}

/** Dialog / popover entrance: fade + a restrained scale. */
export function scaleIn(reduced = false): Variants {
  return {
    hidden: { opacity: 0, scale: reduced ? 1 : 0.97 },
    visible: { opacity: 1, scale: 1, transition: transitions.medium },
    exit: {
      opacity: 0,
      scale: reduced ? 1 : 0.98,
      transition: { duration: DURATION.fast, ease: EASE_IN_OUT },
    },
  };
}

/** Hover/tap feedback for buttons and cards. */
export const interactive = {
  /** Neutral: primary CTAs, cards. */
  subtle: {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  },
  /** Conversion points ("Upgrade to Pro") — a touch more energy, still tasteful. */
  energetic: {
    hover: { scale: 1.04, y: -2 },
    tap: { scale: 0.98, y: 0 },
  },
  /** Cards that lift on hover. */
  lift: {
    hover: { y: -4 },
    tap: { y: -1 },
  },
} as const;
