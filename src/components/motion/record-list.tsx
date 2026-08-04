"use client";

import * as motionReact from "motion/react";
import type { ReactNode } from "react";

import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

const { AnimatePresence, motion, useReducedMotion } = motionReact;

/**
 * Record lists (vaccines, medications, documents) that animate rows in and out
 * instead of having them blink into existence.
 *
 * `AnimatePresence` needs stable keys and a client boundary, so the list
 * markup is passed in as pre-rendered children from the server component and
 * only the wrapper lives here.
 */
export function RecordList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <div className={className}>{children}</div>
    </AnimatePresence>
  );
}

/**
 * One row. Slides away on exit so the gap left behind closes — a row that
 * fades but leaves a hole reads as a bug.
 *
 * Renders the same element either way, dropping only the movement when motion
 * is reduced, so the markup matches between server and client.
 */
export function RecordRow({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id: string;
}) {
  const shouldReduce = useReducedMotion() ?? false;

  return (
    <motion.div
      key={id}
      layout={!shouldReduce}
      className={cn(className, "overflow-hidden")}
      initial={{ opacity: 0, y: shouldReduce ? 0 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: shouldReduce ? 0 : -16 }}
      transition={transitions.base}
    >
      {children}
    </motion.div>
  );
}
