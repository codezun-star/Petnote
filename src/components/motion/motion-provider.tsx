"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { ReactNode } from "react";

import { EASE_OUT } from "@/lib/motion";

/**
 * App-wide motion setup.
 *
 * - `MotionConfig reducedMotion="user"` is the global prefers-reduced-motion
 *   switch: Motion then drops transform/layout animations for those users
 *   automatically, everywhere, without each component opting in.
 * - `LazyMotion` with the `domAnimation` feature set keeps the client bundle
 *   small — we don't use drag or layout projection.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE_OUT }}>
      <LazyMotion features={domAnimation} strict={false}>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
