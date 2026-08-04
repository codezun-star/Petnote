import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  Check,
  FileText,
  QrCode,
  Scale,
  ShieldCheck,
  Stethoscope,
  Syringe,
} from "lucide-react";

import { HeroBackground } from "@/components/marketing/hero-background";
import { HeroItem, HeroSequence } from "@/components/marketing/hero-sequence";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { AnimatedCta, HoverLift } from "@/components/motion/cta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLAN_FEATURES, getDisplayPrice } from "@/lib/plans";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    icon: Syringe,
    title: "Vaccination calendar",
    description:
      "Log every shot with the date it was given and when the next one is due. Overdue items are flagged before your vet has to chase you.",
  },
  {
    icon: Bell,
    title: "Reminders that actually arrive",
    description:
      "One email a day covering anything due in the next week, across all your pets. Turn it off whenever you like.",
  },
  {
    icon: Stethoscope,
    title: "Complete medical history",
    description:
      "Visits, diagnoses, treatments, surgeries and current medications — in one place instead of a folder of paper.",
  },
  {
    icon: Scale,
    title: "Weight tracking",
    description:
      "Log weight at each visit and watch the trend. Steady weight change is one of the earliest signals something's off.",
  },
  {
    icon: FileText,
    title: "Documents that stay findable",
    description:
      "Upload lab results, x-rays and certificates. Private by default, and one tap away when a vet asks.",
  },
  {
    icon: QrCode,
    title: "Emergency Mode",
    description:
      "A QR code for your pet's collar. Whoever finds them sees allergies, medications and your phone number — no app, no login.",
  },
];

export default function LandingPage() {
  const price = getDisplayPrice();

  return (
    <>
      {/* Scroll-driven reveals for every [data-reveal] element below. */}
      <ScrollReveal />

      {/* Hero — full-bleed photo behind the whole section */}
      <section className="relative isolate flex min-h-[36rem] items-center lg:min-h-[44rem]">
        <HeroBackground />

        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <HeroSequence className="max-w-2xl">
            <HeroItem>
              <Badge variant="fresh" className="mb-5">
                <ShieldCheck />
                Emergency Mode is free, forever
              </Badge>
            </HeroItem>

            <HeroItem>
              {/* White copy over the scrim — the section owns a dark surface,
                  so it doesn't use the page's default foreground color. */}
              <h1 className="text-shadow-hero text-[2rem] font-bold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Your pet&apos;s health, all in one place
              </h1>
            </HeroItem>

            <HeroItem>
              <p className="text-shadow-hero mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:mt-5 sm:text-lg">
                Petnote keeps vaccinations, medical history, weight and documents organized — and
                gives every pet a QR tag that shows critical info to whoever finds them.
              </p>
            </HeroItem>

            <HeroItem>
              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                <AnimatedCta className="w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
                  <Button asChild size="lg" variant="accent">
                    <Link href="/signup">Start free — no card needed</Link>
                  </Button>
                </AnimatedCta>
                <AnimatedCta className="w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                  >
                    <Link href="#emergency">See Emergency Mode</Link>
                  </Button>
                </AnimatedCta>
              </div>
            </HeroItem>

            <HeroItem>
              <p className="text-shadow-hero mt-5 max-w-md text-sm text-white/80">
                Free plan includes one pet, the full health calendar and an Emergency Mode QR code.
              </p>
            </HeroItem>
          </HeroSequence>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-border/60 bg-card/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-2xl" data-reveal>
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Everything a pet owner has to remember
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Not another app to feed. Petnote is the place you check when the vet asks
              &ldquo;when was the last one?&rdquo; — and the place that tells you before they do.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} data-reveal className="h-full transition-colors hover:border-primary/30">
                  <CardContent className="p-6">
                    <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emergency Mode */}
      <section id="emergency" className="scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div data-reveal>
              <Badge variant="accent" className="mb-4">
                Always free
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                If your pet goes missing, seconds matter
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Print a Petnote QR code onto your pet&apos;s tag. Anyone who finds them can scan it
                with a phone camera and immediately see who to call — plus the allergies and
                medications a vet would need to know.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  "No app to install and no account to create — it opens in a browser",
                  "Shows only what a finder needs: contact numbers, allergies, medications",
                  "Your medical history, documents and notes stay private",
                  "Turn the link off any time if a tag goes missing",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-fresh" />
                    {item}
                  </li>
                ))}
              </ul>

              <AnimatedCta className="mt-8">
                <Button asChild size="lg">
                  <Link href="/signup">Create your pet&apos;s tag</Link>
                </Button>
              </AnimatedCta>
            </div>

            <div data-reveal>
              <EmergencyPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 border-t border-border/60 bg-card/50">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Simple pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free with one pet. Upgrade when your household grows.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div data-reveal>
              <HoverLift>
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col p-6 sm:p-7">
                    <h3 className="text-lg font-semibold text-foreground">Free</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Everything one pet needs.</p>
                    <p className="mt-5 text-4xl font-bold tracking-tight text-primary">
                      $0
                      <span className="text-base font-normal text-muted-foreground">/month</span>
                    </p>

                    <ul className="mt-6 flex-1 space-y-2.5">
                      {PLAN_FEATURES.free.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                          <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="mt-7 h-auto min-h-12 w-full whitespace-normal py-3 text-center"
                    >
                      <Link href="/signup">Get started free</Link>
                    </Button>
                  </CardContent>
                </Card>
              </HoverLift>
            </div>

            <div data-reveal>
              <HoverLift>
                <Card className="h-full border-accent/50">
                  <CardContent className="flex h-full flex-col p-6 sm:p-7">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-foreground">Pro</h3>
                      <Badge variant="accent">Most popular</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      For multi-pet households and complete records.
                    </p>
                    <p className="mt-5 text-4xl font-bold tracking-tight text-primary">
                      {price.monthly ?? "Simple pricing"}
                      {price.monthly ? (
                        <span className="text-base font-normal text-muted-foreground">/month</span>
                      ) : null}
                      <span className="mt-1 block text-base font-normal text-muted-foreground">
                        {price.yearly ? `or ${price.yearly}/year` : "billed monthly or yearly"}
                      </span>
                    </p>

                    <ul className="mt-6 flex-1 space-y-2.5">
                      {PLAN_FEATURES.pro.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                          <Check className="mt-0.5 size-4 shrink-0 text-fresh" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Conversion point — the more energetic hover preset.
                        Full-width CTAs drop `whitespace-nowrap` and grow in
                        height instead, so a long label wraps rather than
                        forcing the card wider than a 320px screen. */}
                    <AnimatedCta intent="energetic" className="mt-7 w-full [&>*]:w-full">
                      <Button
                        asChild
                        variant="accent"
                        size="lg"
                        className="h-auto min-h-12 w-full whitespace-normal py-3 text-center"
                      >
                        <Link href="/signup">Start free, upgrade any time</Link>
                      </Button>
                    </AnimatedCta>
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      Exact pricing is shown at checkout in your local currency.
                    </p>
                  </CardContent>
                </Card>
              </HoverLift>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-24" data-reveal>
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Start with one pet. It takes two minutes.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Add their name and species, and you&apos;ll have a health record and an Emergency Mode
            QR code before your coffee gets cold.
          </p>
          <AnimatedCta className="mt-8">
            <Button asChild size="lg">
              <Link href="/signup">Create your free account</Link>
            </Button>
          </AnimatedCta>
        </div>
      </section>
    </>
  );
}

/** Stylised Emergency Mode phone mock. */
function EmergencyPreview() {
  return (
    <div className="mx-auto max-w-xs rounded-[2rem] border-8 border-primary bg-card p-4 shadow-[0_25px_60px_-30px_rgba(23,55,92,0.55)]">
      <div className="rounded-2xl bg-background p-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
          Emergency information
        </span>
        <p className="mt-3 text-2xl font-bold text-primary">Luna</p>
        <p className="text-xs text-muted-foreground">Dog · Border Collie</p>

        <div className="mx-auto mt-3 flex size-20 items-center justify-center rounded-full bg-primary-soft text-4xl">
          🐕
        </div>

        <div className="mt-4 rounded-xl bg-primary p-3 text-left text-primary-foreground">
          <p className="text-[10px] opacity-75">Alex Rivera (owner)</p>
          <p className="text-base font-bold">+1 555 010 4477</p>
        </div>

        <div className="mt-2 rounded-xl border-2 border-danger/30 bg-danger/10 p-3 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wide text-danger">Allergies</p>
          <p className="text-sm font-medium text-foreground">Penicillin</p>
        </div>

        <div className="mt-2 rounded-xl border border-border bg-card p-3 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Medications</p>
          <p className="text-sm text-foreground">Apoquel — 5.4 mg, twice daily</p>
        </div>
      </div>
    </div>
  );
}
