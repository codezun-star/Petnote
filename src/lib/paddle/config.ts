/**
 * Paddle configuration.
 *
 * This Paddle account also serves another product, so the webhook handler must
 * be able to tell Petnote events apart from everything else. `PETNOTE_PRICE_IDS`
 * is that allowlist: any subscription whose items don't include one of these
 * prices is ignored outright. Optionally set PADDLE_PRODUCT_ID as a second
 * filter if you'd rather match at the product level.
 */

export type BillingCycle = "monthly" | "yearly";

export const paddleConfig = {
  environment: (process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox") as "sandbox" | "production",
  clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "",
  priceIds: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_MONTHLY ?? "",
    yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_YEARLY ?? "",
  },
} as const;

/** Server-side view of the same ids, plus the optional product filter. */
export function getPetnotePriceIds(): string[] {
  return [
    process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_MONTHLY,
    process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_YEARLY,
  ].filter((value): value is string => Boolean(value));
}

export function getPetnoteProductId(): string | null {
  return process.env.PADDLE_PRODUCT_ID ?? null;
}

export function isCheckoutConfigured(): boolean {
  return Boolean(
    paddleConfig.clientToken && (paddleConfig.priceIds.monthly || paddleConfig.priceIds.yearly),
  );
}
