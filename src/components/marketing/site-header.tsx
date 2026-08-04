import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { AuthCta } from "@/components/marketing/auth-cta";
import { MobileMenu } from "@/components/marketing/mobile-menu";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#emergency", label: "Emergency Mode" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Petnote home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Sign-in CTA is desktop-only; on mobile it lives inside the menu,
              so the header keeps room for the logo and the menu button. */}
          <div className="hidden items-center gap-2 md:flex">
            <AuthCta />
          </div>
          <MobileMenu links={LINKS} />
        </div>
      </div>
    </header>
  );
}
