import { Badge } from "@/components/ui/badge";
import { daysUntil, describeDueDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Colour-codes a due date: red once it's passed, amber inside two weeks,
 * teal when it's comfortably ahead.
 *
 * Overdue badges get a slow opacity pulse to pull the eye. It's deliberately
 * gentle — 2.4s, opacity only — because this sits next to a pet's medical
 * record, not in a game. `prefers-reduced-motion` stops it via the global CSS
 * rule in globals.css.
 */
export function DueBadge({ date }: { date: string }) {
  const days = daysUntil(date);
  const isOverdue = days < 0;
  const variant = isOverdue ? "danger" : days <= 14 ? "warning" : "fresh";

  return (
    <Badge variant={variant} className={cn(isOverdue && "pulse-attention")}>
      {describeDueDate(date)}
    </Badge>
  );
}
