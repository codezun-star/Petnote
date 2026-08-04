import { Badge } from "@/components/ui/badge";
import { daysUntil, describeDueDate } from "@/lib/format";

/**
 * Colour-codes a due date: red once it's passed, amber inside two weeks,
 * teal when it's comfortably ahead.
 */
export function DueBadge({ date }: { date: string }) {
  const days = daysUntil(date);
  const variant = days < 0 ? "danger" : days <= 14 ? "warning" : "fresh";
  return <Badge variant={variant}>{describeDueDate(date)}</Badge>;
}
