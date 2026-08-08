import { siteConfig, absoluteUrl } from "@/lib/site";

/**
 * Structured data builders.
 *
 * Everything here is rendered server-side into a <script type="application/ld+json">
 * so crawlers and answer engines (ChatGPT, Perplexity, Google's AI surfaces)
 * read it without executing JavaScript.
 *
 * One rule throughout: never assert anything the page doesn't visibly say.
 * Invented review counts and ratings are a manual-action risk, and an FAQ in
 * schema that isn't on the page is a guideline violation — so `faqPage` is
 * always built from the same array the page renders.
 */

/** Google truncates `headline` past 110 characters and flags longer ones. */
const MAX_HEADLINE = 110;

/**
 * The size every social scraper expects. Facebook, WhatsApp, LinkedIn, Slack
 * and X all crop toward this ratio, and undersized cards get dropped entirely.
 */
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/**
 * Absolute URL of a post's share card.
 *
 * Absolute is not a style preference: scrapers fetch og:image without a
 * document base, so a relative path silently yields no preview at all.
 */
export function shareImageUrl(slug: string): string {
  return absoluteUrl(`/blog/${slug}/share.png`);
}

/**
 * The site-wide card, for pages that aren't a single article.
 *
 * Any page declaring its own `openGraph` replaces the one inherited from the
 * root layout, which silently drops the file-convention image with it. Such
 * pages must name an image explicitly, or they ship with no preview at all.
 */
export function siteShareImageUrl(): string {
  return absoluteUrl("/opengraph-image.png");
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

const ORGANIZATION_ID = absoluteUrl("/#organization");
const WEBSITE_ID = absoluteUrl("/#website");

/** Reference to the Organization node rather than repeating it in every graph. */
const organizationRef = { "@id": ORGANIZATION_ID };

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: siteConfig.name,
    url: absoluteUrl("/"),
    description: siteConfig.description,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/logo-full.png"),
    },
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: siteConfig.name,
    url: absoluteUrl("/"),
    description: siteConfig.description,
    inLanguage: "en-US",
    publisher: organizationRef,
  };
}

/**
 * The product itself, for the landing page.
 *
 * `offers` describes only the Free tier: its price is a fact (zero), while the
 * Pro price lives in Paddle and is localised at checkout, so quoting a number
 * here would risk contradicting what the user is actually charged.
 */
export function softwareApplicationSchema() {
  return {
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    description: siteConfig.description,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web, iOS, Android",
    browserRequirements: "Requires a modern browser with JavaScript enabled.",
    publisher: organizationRef,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan — one pet profile, vaccine reminders and Emergency Mode.",
      url: absoluteUrl("/#pricing"),
    },
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export type ArticleSchemaInput = {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified: string;
  author: string;
  imageUrl: string;
  tags: string[];
  wordCount?: number;
};

export function articleSchema(input: ArticleSchemaInput) {
  const url = absoluteUrl(input.path);

  return {
    "@type": "BlogPosting",
    headline: truncate(input.title, MAX_HEADLINE),
    description: input.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: { "@type": "Organization", name: input.author, url: absoluteUrl("/") },
    publisher: organizationRef,
    image: {
      "@type": "ImageObject",
      url: input.imageUrl,
      width: 1200,
      height: 630,
    },
    inLanguage: "en-US",
    isPartOf: { "@id": WEBSITE_ID },
    ...(input.tags.length > 0 ? { keywords: input.tags.join(", ") } : {}),
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
  };
}

export type Faq = { question: string; answer: string };

/**
 * Only ever call this with questions the page also renders as text — schema
 * describing invisible content is exactly what Google penalises.
 */
export function faqPageSchema(faqs: Faq[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/** Wraps nodes into one `@graph` so a page emits a single connected document. */
export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
