"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * Header call-to-action that swaps once we know whether the visitor is signed
 * in.
 *
 * This is resolved in the browser on purpose. Reading the session on the
 * server would make every marketing route dynamic, and the blog needs to stay
 * statically generated for SEO. The logged-out state is what gets prerendered,
 * so it's the one that must look right on first paint.
 */
export function AuthCta() {
  // Starts false so the prerendered markup and the first client render agree.
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      // Supabase isn't configured in this environment; keep the default CTA.
      return;
    }

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) setIsLoggedIn(Boolean(data.user));
      })
      .catch(() => {
        // Leave the signed-out CTA in place.
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoggedIn) {
    return (
      <Button asChild size="sm">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
        <Link href="/login">Log in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/signup">Get started free</Link>
      </Button>
    </>
  );
}
