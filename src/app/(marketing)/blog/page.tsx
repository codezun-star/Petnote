import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getAllPosts } from "@/lib/blog";
import { formatLongDate } from "@/lib/format";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical guides on pet vaccination schedules, weight monitoring, and what to do if your pet goes missing.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: `Blog · ${siteConfig.name}`,
    description:
      "Practical guides on pet vaccination schedules, weight monitoring, and what to do if your pet goes missing.",
    url: `${siteConfig.url}/blog`,
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
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
            <Card key={post.slug} data-blog-card className="transition-colors hover:border-primary/30">
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
          ))}
        </div>
      )}
    </div>
  );
}
