import "server-only";

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  coverImage: string | null;
  author: string;
  readingMinutes: number;
  content: string;
};

export type BlogPostSummary = Omit<BlogPost, "content">;

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const WORDS_PER_MINUTE = 220;

function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function readPost(fileName: string): BlogPost {
  const slug = fileName.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, fileName), "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    description: typeof data.description === "string" ? data.description : "",
    // gray-matter parses unquoted YAML dates into Date objects; normalise to
    // an ISO day string so sorting and formatting stay predictable.
    date:
      data.date instanceof Date
        ? data.date.toISOString().slice(0, 10)
        : String(data.date ?? "1970-01-01").slice(0, 10),
    tags: toStringArray(data.tags),
    coverImage: typeof data.coverImage === "string" ? data.coverImage : null,
    author: typeof data.author === "string" ? data.author : "The Petnote team",
    readingMinutes: estimateReadingMinutes(content),
    content,
  };
}

function listFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter((file) => /\.mdx?$/.test(file));
}

/** All posts, newest first. Read at build time for static generation. */
export function getAllPosts(): BlogPostSummary[] {
  return listFiles()
    .map((file) => {
      const post = readPost(file);
      return {
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.date,
        tags: post.tags,
        coverImage: post.coverImage,
        author: post.author,
        readingMinutes: post.readingMinutes,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostSlugs(): string[] {
  return listFiles().map((file) => file.replace(/\.mdx?$/, ""));
}

export function getPost(slug: string): BlogPost | null {
  const match = listFiles().find((file) => file.replace(/\.mdx?$/, "") === slug);
  return match ? readPost(match) : null;
}
