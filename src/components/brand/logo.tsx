import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /**
   * `horizontal` — icon beside the wordmark. For headers and any bar-shaped
   * space, where the stacked lockup would shrink the wordmark to noise.
   * `full` — the complete stacked lockup with the tagline. For places with
   * vertical room: the footer, auth cards, the emergency page.
   */
  variant?: "horizontal" | "full";
  /** Rendered height in px. Width follows the artwork's aspect ratio. */
  height?: number;
  /** Set on the one logo above the fold so it isn't lazy-loaded. */
  priority?: boolean;
};

// Intrinsic sizes of the exported artwork, needed so next/image can reserve
// space and avoid layout shift.
const VARIANTS = {
  horizontal: { src: "/logo-horizontal.png", width: 801, height: 200 },
  full: { src: "/logo-full.png", width: 642, height: 480 },
} as const;

export function Logo({
  className,
  variant = "horizontal",
  height = 36,
  priority = false,
}: LogoProps) {
  const art = VARIANTS[variant];
  const width = Math.round((art.width / art.height) * height);

  return (
    <Image
      src={art.src}
      alt="Petnote"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height, width }}
      sizes={`${width}px`}
    />
  );
}
