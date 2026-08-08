export const siteConfig = {
  name: "Petnote",
  tagline: "Your pet's health, all in one place",
  description:
    "Petnote keeps your pet's vaccinations, medical history, weight and documents organized — plus a free Emergency Mode QR code that shows critical info to whoever finds them.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://petnote.codezun.com",
} as const;

/**
 * Absolute URL for metadata, emails and QR payloads.
 *
 * Falls back to the Vercel-provided host so preview deployments generate QR
 * codes that actually resolve.
 */
export function absoluteUrl(path: string = "/"): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    siteConfig.url;

  const url = new URL(path, base);

  // Next emits the home page's <link rel="canonical"> without a trailing
  // slash. Returning the same form here keeps the canonical, the sitemap entry
  // and the JSON-LD `url` byte-identical — a mismatch is harmless to rankings
  // but shows up as noise in Search Console.
  if (url.pathname === "/" && !url.search && !url.hash) return url.origin;

  return url.toString();
}
