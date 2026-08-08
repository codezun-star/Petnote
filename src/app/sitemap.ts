import type { MetadataRoute } from "next";

import { getAllPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site";

/**
 * Every indexable URL. Private routes are excluded here as well as in
 * robots.ts — listing a disallowed path in a sitemap is a contradiction
 * crawlers report as an error.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const allPosts = getAllPosts();

  const posts = allPosts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    // The revision date, not the publish date, so a corrected article is
    // recrawled instead of looking untouched since launch.
    lastModified: new Date(`${post.updated}T00:00:00Z`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // The index changes whenever the newest post does; claiming "today" on every
  // build would train crawlers to ignore the signal.
  const newestPost = allPosts[0]?.updated;

  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: newestPost ? new Date(`${newestPost}T00:00:00Z`) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts,
  ];
}
