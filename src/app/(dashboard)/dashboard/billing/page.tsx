import type { Metadata } from "next";
import { Check, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLongDate } from "@/lib/format";
import { PLAN_FEATURES, PLAN_NAMES } from "@/lib/plans";
import { countDocuments, countPets, requireAccount } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Plan & billing",
  robots: { index: false, follow: false },
};

const STATUS_COPY: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Payment failed — we're retrying",
  paused: "Paused",
  canceled: "Canceled",
};

export default async function BillingPage(props: PageProps<"/dashboard/billing">) {
  const searchParams = await props.searchParams;
  const [account, petCount, documentCount] = await Promise.all([
    requireAccount(),
    countPets(),
    countDocuments(),
  ]);

  const isPro = account.plan === "pro";
  const subscription = account.subscription;

  return (
    <>
      <PageHeader
        title="Plan & billing"
        description="Emergency Mode is free on every plan — it always will be."
      />

      {searchParams.upgraded ? (
        <Alert variant="success" className="mb-6">
          <Check />
          <AlertDescription>
            Thanks for upgrading. If your plan still shows as Free, give it a few seconds and
            reload — we&apos;re waiting on confirmation from Paddle.
          </AlertDescription>
        </Alert>
      ) : null}

      {subscription?.status === "past_due" ? (
        <Alert variant="warning" className="mb-6">
          <AlertDescription>
            <span className="font-semibold">We couldn&apos;t take your last payment.</span> Your Pro
            features stay on while Paddle retries. Update your card from the receipt email to avoid
            interruption.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mb-6">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              You&apos;re on the {PLAN_NAMES[account.plan]} plan
              {isPro ? <Badge variant="fresh">Pro</Badge> : null}
            </CardTitle>
            <CardDescription>
              {subscription?.status ? STATUS_COPY[subscription.status] ?? subscription.status : "Active"}
              {subscription?.current_period_end
                ? subscription.cancel_at_period_end
                  ? ` · Ends ${formatLongDate(subscription.current_period_end)}`
                  : ` · Renews ${formatLongDate(subscription.current_period_end)}`
                : ""}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <UsageStat
              label="Pets"
              used={petCount}
              limit={account.limits.maxPets}
            />
            <UsageStat
              label="Documents"
              used={documentCount}
              limit={account.limits.maxDocuments}
            />
            <div>
              <dt className="text-sm text-muted-foreground">Weight history</dt>
              <dd className="mt-1 text-lg font-semibold text-foreground">
                {account.limits.weightHistoryDays === null ? "Complete" : "Last 3 months"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {isPro ? (
        <Card>
          <CardHeader>
            <CardTitle>Manage your subscription</CardTitle>
            <CardDescription>
              Payments are handled by Paddle, our merchant of record. Use the link in any Paddle
              receipt email to update your card, change plan or cancel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {PLAN_FEATURES.pro.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-fresh" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>What you have today.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {PLAN_FEATURES.free.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-accent/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Pro
                <Badge variant="accent">
                  <Sparkles />
                  Recommended
                </Badge>
              </CardTitle>
              <CardDescription>
                For households with more than one pet, or a record worth keeping in full.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-2">
                {PLAN_FEATURES.pro.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-fresh" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                <UpgradeButton
                  cycle="monthly"
                  userId={account.userId}
                  email={account.email}
                  label="Upgrade monthly"
                />
                <UpgradeButton
                  cycle="yearly"
                  userId={account.userId}
                  email={account.email}
                  label="Upgrade yearly (save more)"
                />
                <p className="text-center text-xs text-muted-foreground">
                  Prices are shown in the checkout in your local currency. Cancel any time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function UsageStat({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-foreground">
        {used}
        <span className="text-sm font-normal text-muted-foreground">
          {limit === null ? " / unlimited" : ` / ${limit}`}
        </span>
      </dd>
    </div>
  );
}
