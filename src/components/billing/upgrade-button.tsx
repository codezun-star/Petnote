"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AnimatedCta } from "@/components/motion/cta";
import { Button } from "@/components/ui/button";
import { paddleConfig, type BillingCycle } from "@/lib/paddle/config";

type UpgradeButtonProps = {
  cycle: BillingCycle;
  userId: string;
  email: string | null;
  label?: string;
  className?: string;
};

/**
 * Opens the Paddle checkout overlay.
 *
 * `custom_data.user_id` is what lets the webhook tie the resulting
 * subscription back to a Petnote account — the entitlement itself is never
 * granted here, only by the webhook.
 */
export function UpgradeButton({ cycle, userId, email, label, className }: UpgradeButtonProps) {
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const priceId = paddleConfig.priceIds[cycle];

  useEffect(() => {
    if (!paddleConfig.clientToken) return;

    let cancelled = false;
    initializePaddle({
      environment: paddleConfig.environment,
      token: paddleConfig.clientToken,
      eventCallback(event) {
        // Paddle confirms the transaction before the webhook lands, so give
        // the handler a moment and then re-read plan state from the server.
        if (event.name === "checkout.completed") {
          setTimeout(() => router.refresh(), 2500);
        }
      },
    })
      .then((instance) => {
        if (!cancelled && instance) setPaddle(instance);
      })
      .catch(() => {
        if (!cancelled) setError("Checkout couldn't load. Please refresh and try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  function openCheckout() {
    if (!paddle || !priceId) {
      setError("Checkout isn't configured yet.");
      return;
    }

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customData: { user_id: userId },
      customer: email ? { email } : undefined,
      settings: {
        displayMode: "overlay",
        theme: "light",
        successUrl: `${window.location.origin}/dashboard/billing?upgraded=1`,
      },
    });
  }

  const disabled = !priceId || !paddleConfig.clientToken;

  return (
    <div className={className}>
      {/* Conversion point: the energetic hover preset, in accent orange. */}
      <AnimatedCta intent="energetic" className="w-full [&>*]:w-full">
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="w-full"
          onClick={openCheckout}
          disabled={disabled || !paddle}
        >
          <Sparkles />
          {label ?? "Upgrade to Pro"}
        </Button>
      </AnimatedCta>
      {disabled ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Add your Paddle client token and price ids to enable checkout.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
