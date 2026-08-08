import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

/**
 * Web app manifest.
 *
 * Next.js serves this at /manifest.webmanifest and links it automatically.
 *
 * Installability needs, at minimum: a name, a start_url, `display` outside
 * `browser`, and a 192px plus a 512px icon. The `maskable` variants matter on
 * Android, which crops icons to the launcher's shape — without one the icon
 * gets dropped into a white box.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // A stable identity string, so a later change to start_url is treated as
    // the same installed app rather than a second one.
    id: "/",
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/dashboard",
    // If the user isn't signed in, /dashboard bounces to /login, so the
    // installed app always opens somewhere useful rather than the marketing
    // page they installed it from.
    scope: "/",
    display: "standalone",
    // Preferred first: a desktop install gets its own window controls, and
    // anything that doesn't understand these falls back to `display`.
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#ECF6FC",
    theme_color: "#17375C",
    categories: ["health", "lifestyle", "utilities"],
    lang: "en",
    dir: "ltr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My pets", url: "/dashboard/pets" },
      { name: "Health calendar", url: "/dashboard/calendar" },
    ],
  };
}
