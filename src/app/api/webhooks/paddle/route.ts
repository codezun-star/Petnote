import { Environment, EventName, Paddle, type EventEntity } from "@paddle/paddle-node-sdk";
import { NextResponse, type NextRequest } from "next/server";

import type { PlanId, SubscriptionStatus } from "@/lib/database.types";
import { getPetnotePriceIds, getPetnoteProductId } from "@/lib/paddle/config";
import { createAdminClient } from "@/lib/supabase/admin";

// Signature verification needs the byte-exact request body, so this handler
// must run on Node and read the raw text before any parsing.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionEventData = {
  id: string;
  status: string;
  customerId: string;
  currentBillingPeriod?: { endsAt?: string | null } | null;
  scheduledChange?: { action?: string | null } | null;
  customData?: Record<string, unknown> | null;
  items?: { price?: { id?: string; productId?: string } | null }[];
};

/** Paddle statuses mapped onto the four we store. */
const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  paused: "paused",
  canceled: "canceled",
};

/**
 * Is this event about Petnote?
 *
 * The account is shared with another product, so anything whose subscription
 * items don't reference a Petnote price (or product, when configured) is not
 * ours and must not touch our subscriptions table.
 */
function isPetnoteSubscription(data: SubscriptionEventData): boolean {
  const priceIds = getPetnotePriceIds();
  const productId = getPetnoteProductId();

  if (priceIds.length === 0 && !productId) {
    // Nothing configured to match against — refuse rather than guess, so a
    // misconfigured deploy can't grant Pro off another product's events.
    console.warn("[paddle] No Petnote price or product ids configured; ignoring event.");
    return false;
  }

  return (data.items ?? []).some((item) => {
    const price = item.price;
    if (!price) return false;
    if (price.id && priceIds.includes(price.id)) return true;
    if (productId && price.productId === productId) return true;
    return false;
  });
}

function resolvePlanAndStatus(data: SubscriptionEventData): {
  plan: PlanId;
  status: SubscriptionStatus;
} {
  const status = STATUS_MAP[data.status] ?? "canceled";
  // A canceled or paused subscription drops the account back to Free; every
  // other state still entitles Pro (see resolvePlan in lib/plans.ts).
  const plan: PlanId = status === "canceled" || status === "paused" ? "free" : "pro";
  return { plan, status };
}

/**
 * Finds the Petnote user this subscription belongs to.
 *
 * `custom_data.user_id` is set when the checkout is opened, which is the happy
 * path. Falling back to an existing row keeps renewals and cancellations
 * working even if custom data is missing from a later event.
 */
async function resolveUserId(
  admin: ReturnType<typeof createAdminClient>,
  data: SubscriptionEventData,
): Promise<string | null> {
  const fromCustomData = data.customData?.user_id;
  if (typeof fromCustomData === "string" && fromCustomData.length > 0) return fromCustomData;

  const { data: existing } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("paddle_subscription_id", data.id)
    .maybeSingle();
  if (existing) return existing.user_id;

  const { data: byCustomer } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("paddle_customer_id", data.customerId)
    .maybeSingle();

  return byCustomer?.user_id ?? null;
}

async function applySubscriptionEvent(data: SubscriptionEventData): Promise<void> {
  if (!isPetnoteSubscription(data)) return;

  const admin = createAdminClient();
  const userId = await resolveUserId(admin, data);

  if (!userId) {
    console.error(`[paddle] No Petnote user matched subscription ${data.id}; skipping.`);
    return;
  }

  const { plan, status } = resolvePlanAndStatus(data);
  const firstPrice = data.items?.[0]?.price ?? null;

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: data.id,
      paddle_customer_id: data.customerId,
      paddle_price_id: firstPrice?.id ?? null,
      paddle_product_id: firstPrice?.productId ?? null,
      status,
      plan,
      current_period_end: data.currentBillingPeriod?.endsAt ?? null,
      cancel_at_period_end: data.scheduledChange?.action === "cancel",
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error(`[paddle] Failed to sync subscription ${data.id}`, error);
    throw new Error("Subscription sync failed");
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  const apiKey = process.env.PADDLE_API_KEY;

  if (!secret || !apiKey) {
    console.error("[paddle] PADDLE_WEBHOOK_SECRET or PADDLE_API_KEY is not configured.");
    return NextResponse.json({ error: "Webhooks are not configured." }, { status: 500 });
  }

  const signature = request.headers.get("paddle-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  const paddle = new Paddle(apiKey, {
    environment:
      process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
        ? Environment.production
        : Environment.sandbox,
  });

  let event: EventEntity;
  try {
    // Nothing in the payload is trusted until this resolves.
    event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
  } catch (error) {
    console.error("[paddle] Signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  try {
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionActivated:
      case EventName.SubscriptionUpdated:
      case EventName.SubscriptionResumed:
      case EventName.SubscriptionTrialing:
      case EventName.SubscriptionPastDue:
      case EventName.SubscriptionPaused:
      case EventName.SubscriptionCanceled:
        await applySubscriptionEvent(event.data as unknown as SubscriptionEventData);
        break;
      default:
        // Everything else (transactions, the other product's events) is a no-op.
        break;
    }
  } catch (error) {
    console.error(`[paddle] Failed to handle ${event.eventType}`, error);
    // A non-2xx makes Paddle retry, which is what we want for a transient
    // database failure.
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
