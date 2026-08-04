import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">
              Your pet&apos;s vaccinations, medical history, weight and documents — organized, and
              ready when it matters.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:gap-14">
            <div>
              <p className="font-semibold text-foreground">Product</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/#features" className="text-muted-foreground hover:text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#emergency" className="text-muted-foreground hover:text-primary">
                    Emergency Mode
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="text-muted-foreground hover:text-primary">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-foreground">Company</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-primary">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-primary">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="text-muted-foreground hover:text-primary">
                    Create an account
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Petnote. Petnote helps you keep records — it isn&apos;t
          veterinary advice. Always consult your vet.
        </p>
      </div>
    </footer>
  );
}
