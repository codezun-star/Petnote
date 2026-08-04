import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** Renders the wordmark in white, for use on the primary-colored header. */
  inverted?: boolean;
};

/**
 * Petnote wordmark: a paw pad drawn from the brand palette next to the name.
 */
export function Logo({ className, inverted = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 32 32"
        className="size-7 shrink-0"
        aria-hidden="true"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="9" fill={inverted ? "#ffffff" : "#17375C"} />
        <ellipse cx="11.1" cy="12.4" rx="2.5" ry="3.1" fill="#26CFC6" />
        <ellipse cx="16" cy="10.6" rx="2.5" ry="3.3" fill="#26CFC6" />
        <ellipse cx="20.9" cy="12.4" rx="2.5" ry="3.1" fill="#26CFC6" />
        <path
          d="M16 16.4c3.4 0 6.1 2.5 6.1 5.2 0 2.1-1.7 3.4-4 3.4-1 0-1.5-.3-2.1-.3s-1.1.3-2.1.3c-2.3 0-4-1.3-4-3.4 0-2.7 2.7-5.2 6.1-5.2Z"
          fill="#F39A3D"
        />
      </svg>
      <span
        className={cn(
          "text-lg font-bold tracking-tight",
          inverted ? "text-white" : "text-primary",
        )}
      >
        Petnote
      </span>
    </span>
  );
}
