import { ImageResponse } from "next/og";

import { getPost, getPostSlugs } from "@/lib/blog";
import { SHARE_IMAGE_SIZE } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

/**
 * Per-post share card, served at a stable /blog/<slug>/share.png.
 *
 * Posts used to emit no og:image at all, so WhatsApp, iMessage and Slack
 * rendered a bare text link and Twitter fell back to the small `summary` card.
 *
 * This is a route handler rather than the `opengraph-image` file convention on
 * purpose: that convention appends a build hash to the URL, which the Article
 * JSON-LD can't predict. Owning the path means og:image, twitter:image and the
 * schema's `image` all point at one URL that stays valid across deploys.
 *
 * Drawn by Satori, not a browser — Tailwind classes and CSS variables don't
 * apply, every element needs an explicit `display`, and nothing may fetch a
 * remote font, because the build must not depend on network access.
 */

/** Posts are files on disk, so every card is baked at build time. */
export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

const NAVY = "#17375C";
const MIST = "#ECF6FC";
const FRESH = "#3FB6A8";

export async function GET(_request: Request, context: RouteContext<"/blog/[slug]/share.png">) {
  const { slug } = await context.params;
  const post = getPost(slug);

  const title = post?.title ?? siteConfig.name;
  const kicker = post?.tags[0] ?? "Pet health guide";
  // Long titles are the norm for long-tail posts; step the size down rather
  // than letting a four-line headline collide with the footer.
  const titleSize = title.length > 80 ? 52 : title.length > 55 ? 62 : 72;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          backgroundColor: NAVY,
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Accent rule, so the card still reads as branded at thumbnail size. */}
        <div style={{ display: "flex", width: 120, height: 10, backgroundColor: FRESH }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: FRESH,
              marginBottom: 24,
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: titleSize,
              lineHeight: 1.12,
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#FFFFFF" }}>
            {siteConfig.name}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: MIST, opacity: 0.85 }}>
            {siteConfig.tagline}
          </div>
        </div>
      </div>
    ),
    SHARE_IMAGE_SIZE,
  );
}
