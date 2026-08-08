import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HoverLift } from "@/components/motion/cta";
import { FadeIn } from "@/components/motion/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getAllPosts } from "@/lib/blog";
import { formatLongDate } from "@/lib/format";
import { SHARE_IMAGE_SIZE, breadcrumbSchema, graph, siteShareImageUrl } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

const BLOG_DESCRIPTION =
  "Practical, vet-informed guides for pet owners: vaccination schedules, weight monitoring, record keeping by state, and what to do if your pet goes missing.";

// The listing isn't a single article, so it uses the site card rather than a
// generated one — but it has to name it, or declaring `openGraph` below would
// drop the inherited image and leave the page with no preview.
const BLOG_SHARE_IMAGE = {
  url: siteShareImageUrl(),
  width: SHARE_IMAGE_SIZE.width,
  height: SHARE_IMAGE_SIZE.height,
  alt: `Blog · ${siteConfig.name}`,
};

export const metadata: Metadata = {
  title: "Blog",
  description: BLOG_DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: `Blog · ${siteConfig.name}`,
    description: BLOG_DESCRIPTION,
    url: absoluteUrl("/blog"),
    siteName: siteConfig.name,
    locale: "en_US",
    images: [BLOG_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog · ${siteConfig.name}`,
    description: BLOG_DESCRIPTION,
    images: [BLOG_SHARE_IMAGE],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  const jsonLd = graph(
    {
      "@type": "CollectionPage",
      name: `Blog · ${siteConfig.name}`,
      description: BLOG_DESCRIPTION,
      url: absoluteUrl("/blog"),
      inLanguage: "en-US",
      // The listing itself, so a crawler sees the set of articles without
      // having to follow every link first.
      mainEntity: {
        "@type": "ItemList",
        itemListElement: posts.map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(`/blog/${post.slug}`),
          name: post.title,
        })),
      },
    },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
    ]),
  );

  return (
    <FadeIn className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
      <JsonLd data={jsonLd} />
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary">The Petnote blog</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Practical, vet-informed guides on keeping your pet healthy — and what to do when
          something goes wrong.
        </p>
      </header>

      {posts.length === 0 ? (
        <EmptyState title="No posts yet" description="Check back soon." />
      ) : (
        <div className="grid gap-5">
          {posts.map((post) => (
            <HoverLift key={post.slug}>
              <Card className="h-full transition-colors hover:border-primary/30">
                <CardContent className="p-6">
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <time dateTime={post.date}>{formatLongDate(post.date)}</time>
                    <span aria-hidden="true">·</span>
                    <span>{post.readingMinutes} min read</span>
                  </div>

                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground group-hover:text-primary">
                    {post.title}
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {post.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                    <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Read
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                </Link>
              </CardContent>
            </Card>
            </HoverLift>
          ))}
        </div>
      )}
    </FadeIn>
  );
}
