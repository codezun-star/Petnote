import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Emergency pages carry a pet's medical details and an owner's phone
      // number. They're public by design but must never be indexed.
      disallow: [
        "/dashboard",
        "/emergency",
        "/api",
        "/auth",
        "/login",
        "/signup",
        "/forgot-password",
        // Carries a recovery token in the URL — must never reach an index.
        "/reset-password",
        "/offline",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
