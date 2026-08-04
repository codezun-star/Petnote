import { LogOut } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/app/(auth)/actions";
import { Logo } from "@/components/brand/logo";
import { DashboardNav } from "@/components/dashboard/nav";
import { AnimatedCta } from "@/components/motion/cta";
import { PageTransition } from "@/components/motion/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLAN_NAMES } from "@/lib/plans";
import { requireAccount } from "@/lib/queries";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const account = await requireAccount();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/dashboard" aria-label="Petnote dashboard">
            <Logo />
          </Link>

          <div className="flex items-center gap-3">
            {account.plan === "pro" ? (
              <Badge variant="fresh">Pro</Badge>
            ) : (
              // Conversion point — the more energetic hover preset.
              <AnimatedCta intent="energetic" className="hidden sm:inline-flex">
                <Button asChild size="sm" variant="accent">
                  <Link href="/dashboard/billing">Upgrade to Pro</Link>
                </Button>
              </AnimatedCta>
            )}

            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-foreground">
                {account.profile?.full_name ?? "Your account"}
              </p>
              <p className="text-xs leading-tight text-muted-foreground">
                {PLAN_NAMES[account.plan]} plan
              </p>
            </div>

            <form action={signOut}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Log out" title="Log out">
                <LogOut />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6 sm:px-6 lg:py-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">
            <DashboardNav />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 lg:hidden">
            <DashboardNav orientation="horizontal" />
          </div>
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </div>
  );
}
