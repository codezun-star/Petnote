"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Checkbox-backed toggle. Kept as a native input so it participates in
 * uncontrolled `<form>` submissions to Server Actions without extra wiring.
 */
function Switch({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <label className="inline-flex cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        className={cn(
          "relative h-6 w-11 rounded-full bg-input transition-colors",
          "peer-checked:bg-fresh peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          "after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform",
          "peer-checked:after:translate-x-5",
          className,
        )}
      />
    </label>
  );
}

export { Switch };
