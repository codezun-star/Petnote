import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

/**
 * Shown by the service worker when a navigation fails with no network.
 *
 * Deliberately static and dependency-free: it has to render from cache with
 * nothing available, so it must not fetch anything or read a session.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <Logo variant="full" height={88} className="mb-8" />

      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <WifiOff className="size-6" />
      </span>

      <h1 className="text-xl font-bold text-foreground">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Petnote needs a connection to load your pet&apos;s records. This page will work again as
        soon as you&apos;re back online.
      </p>
    </div>
  );
}
