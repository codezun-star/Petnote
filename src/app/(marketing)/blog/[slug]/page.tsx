import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";

import { mdxComponents } from "@/components/blog/mdx";
import { FadeIn } from "@/components/motion/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPost, getPostSlugs } from "@/lib/blog";
import { formatLongDate } from "@/lib/format";
import {
  SHARE_IMAGE_SIZE,
  articleSchema,
  breadcrumbSchema,
  faqPageSchema,
  graph,
  shareImageUrl,
} from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

/** Posts are files on disk, so every route is known at build time. */
export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) return { title: "Post not found" };

  // Absolute, and the same URL the Article schema advertises. Scrapers reject
  // relative og:image values outright, which is what broke link previews.
  const image = {
    url: shareImageUrl(post.slug),
    width: SHARE_IMAGE_SIZE.width,
    height: SHARE_IMAGE_SIZE.height,
    alt: post.title,
  };

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: absoluteUrl(`/blog/${post.slug}`),
      siteName: siteConfig.name,
      locale: "en_US",
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [post.author],
      tags: post.tags,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [image],
    },
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) notFound();

  // The share card doubles as the article's schema image, so both surfaces
  // describe the same artwork rather than drifting apart.
  const imageUrl = shareImageUrl(post.slug);

  const jsonLd = graph(
    articleSchema({
      title: post.title,
      description: post.description,
      path: `/blog/${post.slug}`,
      datePublished: post.date,
      dateModified: post.updated,
      author: post.author,
      imageUrl,
      tags: post.tags,
      wordCount: post.wordCount,
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
    // Only emitted when the post actually renders the questions below.
    ...(post.faqs.length > 0 ? [faqPageSchema(post.faqs)] : []),
  );

  // Reading page: one gentle fade on load, and nothing scroll-driven that
  // would compete with the text.
  return (
    <FadeIn as="article" distance={6} className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
      <JsonLd data={jsonLd} />

      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6">
        <Link href="/blog">
          <ArrowLeft />
          All posts
        </Link>
      </Button>

      <header>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <time dateTime={post.date}>{formatLongDate(post.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
        </div>

        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-primary">
          {post.title}
        </h1>

        {post.description ? (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.description}</p>
        ) : null}

        {post.tags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </header>

      <div className="mt-10">
        <MDXRemote
          source={post.content}
          components={mdxComponents}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </div>

      {/*
        Rendered from the same array that feeds the FAQPage schema above.
        Answer engines quote this section directly, and Google requires the
        questions to be visible on the page for the markup to be eligible.
      */}
      {post.faqs.length > 0 ? (
        <section className="mt-14" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl font-bold tracking-tight text-foreground">
            Frequently asked questions
          </h2>
          <dl className="mt-6 divide-y divide-border border-t border-border">
            {post.faqs.map((faq) => (
              <div key={faq.question} className="py-5">
                <dt className="text-base font-semibold text-foreground">{faq.question}</dt>
                <dd className="mt-2 leading-relaxed text-foreground/90">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <aside className="mt-14 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Keep this in one place</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Petnote tracks vaccinations, medical history, weight and documents for your pet — and
          gives them a free Emergency Mode QR tag.
        </p>
        <Button asChild className="mt-4">
          <Link href="/signup">Start free</Link>
        </Button>
      </aside>
    </FadeIn>
  );
}
