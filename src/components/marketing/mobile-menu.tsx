"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type NavLink = { href: string; label: string };

/**
 * Mobile navigation.
 *
 * Built on Radix Dialog so it gets a focus trap, Escape-to-close and correct
 * aria wiring for free — a hand-rolled disclosure leaves keyboard and screen
 * reader users stranded behind an open overlay.
 *
 * The signed-in state is resolved in the browser for the same reason as the
 * desktop header: marketing routes must stay static, so nothing here may read
 * the session on the server.
 */
export function MobileMenu({ links }: { links: readonly NavLink[] }) {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) setIsLoggedIn(Boolean(data.user));
      })
      .catch(() => {
        // Keep the signed-out links.
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

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu />
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-[2px] duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 md:hidden" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col gap-6 border-l border-border bg-card p-6 shadow-xl duration-200 ease-out data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right md:hidden"
        >
          <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Petnote navigation
          </DialogPrimitive.Description>

          <div className="flex items-center justify-between">
            <Logo height={32} />
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close menu">
                <X />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-border pt-6">
            {isLoggedIn ? (
              <Button asChild size="lg" onClick={() => setOpen(false)}>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="lg" onClick={() => setOpen(false)}>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="lg" variant="accent" onClick={() => setOpen(false)}>
                  <Link href="/signup">Get started free</Link>
                </Button>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
