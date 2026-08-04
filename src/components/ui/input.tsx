import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        // `min-w-0` matters: an <input> has an intrinsic width of roughly 20
        // characters, and `type="date"` is wider still on iOS. Inside a flex
        // or grid parent that intrinsic size becomes the track's minimum and
        // pushes the whole layout wider than the screen.
        "flex h-10 w-full min-w-0 max-w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-none transition-colors",
        "placeholder:text-muted-foreground/70",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "file:mr-3 file:rounded-md file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
