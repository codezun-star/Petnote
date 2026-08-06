"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Dashboard error boundary.
 *
 * Next strips error messages from production builds, so an unhandled server
 * error normally renders as an opaque "a server error occurred" page. It does
 * keep a `digest` — the same value it writes to the server log — so showing it
 * here turns an unreportable crash into one line you can search for in the
 * hosting provider's logs.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] Render failed", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="size-6" />
      </span>

      <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        This page couldn&apos;t load. Trying again often works — if it doesn&apos;t, the reference
        below identifies the exact error in the server logs.
      </p>

      {error.digest ? (
        <p className="mt-4 rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
          Error reference: {error.digest}
        </p>
      ) : null}

      {/* In development the real message survives; showing it saves a trip to
          the terminal. Production builds have it stripped, so this is empty. */}
      {process.env.NODE_ENV !== "production" && error.message ? (
        <pre className="mt-3 max-w-lg overflow-x-auto rounded-lg border border-danger/25 bg-danger/5 p-3 text-left font-mono text-xs text-danger">
          {error.message}
        </pre>
      ) : null}

      <div className="mt-6 flex gap-3">
        <Button type="button" onClick={reset}>
          <RotateCw />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
