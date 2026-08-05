# Petnote

Centralized pet health records — vaccinations, medical history, weight tracking, documents, and a
free public **Emergency Mode** page reachable by QR code.

Deployed at **petnote.codezun.com**.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Radix primitives) |
| Database / Auth / Storage | Supabase |
| Charts | Recharts |
| Animation | Motion + GSAP ScrollTrigger (landing page only) |
| QR codes | `qrcode`, generated client-side |
| Payments | Paddle (Paddle.js overlay + webhook) |
| Email | Resend, via a Supabase Edge Function |
| Blog | Markdown files, statically generated |
| Hosting | Vercel |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase + Paddle credentials
npm run dev
```

`npm run typecheck` and `npm run lint` cover the static checks; `npm run build` runs both plus the
production build.

## Design system

The four brand colors are defined once, in `src/app/globals.css`:

| Token | Hex | Utilities |
| --- | --- | --- |
| Primary (trust) | `#17375C` | `bg-primary`, `text-primary`, `border-primary` |
| Accent (energy) | `#F39A3D` | `bg-accent`, `text-accent` |
| Fresh (care) | `#26CFC6` | `bg-fresh`, `text-fresh` |
| Background | `#ECF6FC` | `bg-background` |

Tailwind v4 configures its theme in CSS rather than `tailwind.config.js`, so these live in the
`@theme inline` block alongside the derived tints, surfaces and feedback colors. Always use the
generated utilities — no hex values in components.

## Database

Migrations are in `supabase/migrations/`, applied in filename order:

1. `..._init_schema.sql` — tables, indexes, the new-user bootstrap trigger
2. `..._rls_policies.sql` — row level security on every table
3. `..._emergency_mode.sql` — the public Emergency Mode reader
4. `..._storage.sql` — buckets and their access policies
5. `..._reminders.sql` — the reminder queue and its daily `pg_cron` schedule

Apply them with the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### Security model

- **Every table has RLS enabled.** A row is reachable only if the caller owns the pet it hangs off,
  centralized in the `public.owns_pet()` helper.
- **Emergency Mode does not open the `pets` table to the public.** Anonymous access goes through
  `public.get_emergency_profile()`, a `SECURITY DEFINER` function returning a fixed column list:
  name, photo, species, breed, allergies, active medications, and the owner/vet contact details.
  Medical history, documents, weight entries and notes are never exposed. Owners can revoke a
  printed QR code at any time via the `emergency_enabled` flag.
- **`subscriptions` has no write policy for users.** Billing state is written exclusively by the
  Paddle webhook handler using the service role key, so a user cannot grant themselves Pro.
- **Storage is split by exposure.** `pet-photos` is public-read (the emergency page has no session)
  but write-scoped to the owner's folder; `pet-documents` is fully private and served only through
  60-second signed URLs.

## Authentication

Users log in with a **username and password**. Supabase Auth only authenticates
by email, so the username is resolved to its email server-side and that is what
`signInWithPassword` receives. Email stays required on the account — it's what
reminders and password resets go to.

The resolver, `public.email_for_username()`, maps a public handle to a private
email address, so it is `SECURITY DEFINER` and executable **only by the service
role**. Nothing reachable from the browser can turn a username into an email.
`public.is_username_available()` returns a bare boolean and is safe to expose
to `anon` for the signup form.

Two consequences worth knowing:

- **`SUPABASE_SERVICE_ROLE_KEY` is now required for login**, not just for the
  Paddle webhook. Without it, username logins fail (email logins still work).
- The login field accepts a username *or* an email — people forget which handle
  they picked, and rejecting a correct email would be a pointless dead end.

Failed logins always return one message regardless of cause, so the form can't
be used to probe which usernames exist.

## Plans

Limits live in `src/lib/plans.ts` and are enforced **server-side** in the relevant Server Action —
the UI affordances are a convenience, not the boundary.

| | Free | Pro |
| --- | --- | --- |
| Pet profiles | 1 | Unlimited |
| Documents | 3 | Unlimited |
| Weight history | Last 3 months | Complete + CSV export |
| Emergency Mode | ✅ | ✅ |

Emergency Mode is free on every plan, permanently — it's the product's sharing hook.

Free-plan weight history is a *display* window, not deletion: older entries stay in the database
and reappear on upgrade.

## Paddle

This Paddle account also serves another product, so the webhook handler filters events by price ID
(`NEXT_PUBLIC_PADDLE_PRICE_ID_MONTHLY` / `_YEARLY`, with optional `PADDLE_PRODUCT_ID`) and ignores
anything that isn't Petnote's. Signatures are verified against `PADDLE_WEBHOOK_SECRET` before the
payload is trusted, and if no price/product IDs are configured the handler refuses to act rather
than guessing.

Point your Paddle webhook at `https://<your-domain>/api/webhooks/paddle` and subscribe to the
`subscription.*` events.

## Reminder emails

`supabase/functions/send-reminders/` runs daily at 09:00 UTC, groups everything due within 7 days
by owner (one email per person, however many pets), sends via Resend, and stamps `reminder_sent_at`
only for messages that actually went out — a failed send retries tomorrow rather than vanishing.

```bash
supabase functions deploy send-reminders --no-verify-jwt
supabase secrets set RESEND_API_KEY=... REMINDER_FROM_EMAIL="Petnote <reminders@petnote.codezun.com>" SITE_URL=https://petnote.codezun.com
```

The schedule uses `pg_cron` + `pg_net`, reading the project URL and service role key from Vault:

```sql
select vault.create_secret('https://<ref>.supabase.co', 'project_url');
select vault.create_secret('<service-role-key>', 'service_role_key');
```

## Blog

Posts are Markdown files in `content/blog/`, parsed with gray-matter and rendered with
next-mdx-remote. Routes are generated at build time (`generateStaticParams` + `dynamicParams =
false`) and per-post metadata — title, description, Open Graph, JSON-LD — comes from frontmatter.

To add a post, drop in a `.md` file with this frontmatter:

```yaml
---
title: "Post title"
description: "One-sentence summary used for SEO and the listing page."
date: 2026-08-01
tags: ["Guides"]
coverImage: null
author: "The Petnote team"
---
```

**Marketing routes must stay static.** Nothing under `src/app/(marketing)/` may read cookies,
headers or the session on the server — that's why the header's signed-in state resolves in the
browser via `AuthCta`.

## Hero image

The landing page hero uses a full-bleed background photo loaded from
`public/hero-pets.jpg`. Replacing that file is all it takes — no code change.
If the file is missing the hero falls back to solid brand navy rather than
breaking.

Aim for a wide landscape shot around 2400 × 1350, under ~500 KB, with the
animals grouped toward the centre-right and calmer space on the left where the
headline sits. The photo is anchored to its bottom edge so the smallest animals
stay in frame, and the crop comes off the sky.

How much of the photo shows through is one line in
`src/components/marketing/hero-background.tsx`:

```tsx
<div className="absolute inset-0 bg-gradient-to-b from-primary/88 ... lg:to-primary/15" />
```

Lower numbers show more photo. Keep the value behind the copy at `/80` or above
so the white headline stays legible.

> If you swap the image and the old one keeps appearing locally, clear
> `.next/cache/images` — the Next image optimizer caches by path. Vercel
> rebuilds it on each deploy.

## Brand assets

The master logo lives at `assets/brand/petnotelogo.png` — outside `public/` so
the 2 MB original is never served. Three optimized variants are generated from
it into `public/`:

| File | Where it's used |
| --- | --- |
| `logo-horizontal.png` | Headers and the mobile menu — the stacked lockup is unreadable in a 64px bar, so this places the icon beside the wordmark |
| `logo-full.png` | Footer, auth pages, emergency page, 404 — anywhere with vertical room for the tagline |
| `logo-mark.png` | Source for the favicon and PWA icons |

Pick the variant through the `Logo` component rather than importing an image
directly:

```tsx
<Logo />                                 // horizontal, 36px tall
<Logo variant="full" height={96} />      // full stacked lockup
```

## PWA

The app is installable. That needs four things, all in place:

- `src/app/manifest.ts` → served at `/manifest.webmanifest`
- 192px and 512px icons, plus `maskable` variants so Android doesn't drop the
  icon into a white box
- `public/sw.js`, registered by `RegisterServiceWorker` in production only
- HTTPS, which Vercel provides

The service worker is deliberately narrow. It only touches same-origin GETs,
**never caches HTML** — dashboard pages are per-user and the emergency page
carries someone's phone number — and caches only content-hashed build output
and brand art. Navigations are network-first and fall back to `/offline`.

`sw.js`, the manifest and `/icons` are excluded from the proxy matcher.
Running them through session refresh would attach `Set-Cookie` and `no-store`
to files the browser must cache, which breaks registration and install.

Bumping `VERSION` in `sw.js` invalidates the old cache on next activation.

## Animation

Shared timings and easing live in `src/lib/motion.ts`; `prefers-reduced-motion` is honored globally
(via `useReducedMotion` in Motion, an explicit check before any GSAP timeline, and a CSS fallback).
GSAP is used only for the landing page's scroll-driven reveals and is dynamically imported, so it
never ships to the authenticated app.

## Environment variables

See `.env.example`. `SUPABASE_SERVICE_ROLE_KEY`, `PADDLE_API_KEY` and `PADDLE_WEBHOOK_SECRET` are
server-only — never prefix them with `NEXT_PUBLIC_`.
