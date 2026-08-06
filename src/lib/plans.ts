import type { PlanId, Subscription } from "@/lib/database.types";

/**
 * Largest file that can be posted through a Server Action.
 *
 * Bounded by two ceilings, not by preference: Next caps Server Action bodies
 * (raised to 4mb in next.config.ts) and Vercel caps a function's request body
 * at 4.5 MB. Keep this, `serverActions.bodySizeLimit`, and the browser-side
 * checks in step.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type { PlanId };

export type PlanLimits = {
  /** Maximum pet profiles. `null` means unlimited. */
  maxPets: number | null;
  /** Maximum stored documents across all pets. `null` means unlimited. */
  maxDocuments: number | null;
  /** How far back the weight chart reaches, in days. `null` means all history. */
  weightHistoryDays: number | null;
  /** CSV export of weight history. */
  canExportWeightHistory: boolean;
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxPets: 1,
    maxDocuments: 3,
    weightHistoryDays: 90,
    canExportWeightHistory: false,
  },
  pro: {
    maxPets: null,
    maxDocuments: null,
    weightHistoryDays: null,
    canExportWeightHistory: true,
  },
};

export const PLAN_NAMES: Record<PlanId, string> = {
  free: "Free",
  pro: "Pro",
};

/**
 * Statuses that still entitle the user to Pro features.
 *
 * `past_due` is intentionally included: Paddle retries a failed payment for
 * several days, and locking someone out of their pet's medical history over a
 * expired card is the wrong call. `canceled` and `paused` drop to Free.
 */
const ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);

export function resolvePlan(subscription: Pick<Subscription, "plan" | "status"> | null): PlanId {
  if (!subscription) return "free";
  if (subscription.plan !== "pro") return "free";
  return ENTITLED_STATUSES.has(subscription.status) ? "pro" : "free";
}

export function getLimits(plan: PlanId): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function isWithinLimit(current: number, max: number | null): boolean {
  return max === null || current < max;
}

/**
 * Display price for the marketing pricing table.
 *
 * The authoritative price lives in Paddle and is what the checkout charges;
 * this is only the number shown on the landing page, kept in an env var so it
 * is configured alongside the Paddle setup rather than hardcoded in source.
 * If it's unset we fall back to copy that promises no specific figure.
 */
export function getDisplayPrice(): { monthly: string | null; yearly: string | null } {
  return {
    monthly: process.env.NEXT_PUBLIC_PRO_PRICE_MONTHLY_DISPLAY ?? null,
    yearly: process.env.NEXT_PUBLIC_PRO_PRICE_YEARLY_DISPLAY ?? null,
  };
}

/** Marketing copy for the pricing table. Prices themselves live in Paddle. */
export const PLAN_FEATURES: Record<PlanId, string[]> = {
  free: [
    "1 pet profile",
    "Vaccine & deworming calendar",
    "Email reminders before due dates",
    "Full medical history & medications",
    "Weight tracking (last 3 months)",
    "3 stored documents",
    "Emergency Mode page + QR code",
  ],
  pro: [
    "Unlimited pet profiles",
    "Everything in Free",
    "Complete weight history + CSV export",
    "Unlimited document storage",
    "Priority support",
    "Emergency Mode page + QR code",
  ],
};
