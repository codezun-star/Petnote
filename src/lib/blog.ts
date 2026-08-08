import "server-only";

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

/** A question and answer rendered on the page *and* emitted as FAQPage schema. */
export type BlogFaq = { question: string; answer: string };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  /** Last substantive edit. Falls back to `date` when the post hasn't changed. */
  updated: string;
  tags: string[];
  coverImage: string | null;
  author: string;
  readingMinutes: number;
  wordCount: number;
  faqs: BlogFaq[];
  content: string;
};

export type BlogPostSummary = Omit<BlogPost, "content">;

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const WORDS_PER_MINUTE = 220;

function countWords(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

/** gray-matter hands back plain YAML objects; keep only well-formed pairs. */
function toFaqs(value: unknown): BlogFaq[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const { question, answer } = entry as Record<string, unknown>;
    if (typeof question !== "string" || typeof answer !== "string") return [];
    if (!question.trim() || !answer.trim()) return [];
    return [{ question: question.trim(), answer: answer.trim() }];
  });
}

/**
 * Normalises a frontmatter date to an ISO day string.
 *
 * gray-matter parses unquoted YAML dates into Date objects, so sorting and
 * formatting stay predictable only if both spellings collapse to one shape.
 */
function toIsoDay(value: unknown, fallback: string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && value.trim()) return value.trim().slice(0, 10);
  return fallback;
}

function readPost(fileName: string): BlogPost {
  const slug = fileName.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, fileName), "utf8");
  const { data, content } = matter(raw);

  const date = toIsoDay(data.date, "1970-01-01");
  const words = countWords(content);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    description: typeof data.description === "string" ? data.description : "",
    date,
    // Schema wants a dateModified even when nothing has been revised yet, and
    // claiming an edit that never happened would be worse than repeating the
    // publish date.
    updated: toIsoDay(data.updated, date),
    tags: toStringArray(data.tags),
    coverImage: typeof data.coverImage === "string" ? data.coverImage : null,
    author: typeof data.author === "string" ? data.author : "The Petnote team",
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    wordCount: words,
    faqs: toFaqs(data.faqs),
    content,
  };
}

function listFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter((file) => /\.mdx?$/.test(file));
}

/**
 * All posts, newest first. Read at build time for static generation.
 *
 * The body is dropped deliberately: listings render titles and descriptions,
 * and shipping fifteen full articles in the payload would cost far more than
 * the page displays. The fields are spelled out rather than spread so that
 * adding one to BlogPost fails this function until it is handled here.
 */
export function getAllPosts(): BlogPostSummary[] {
  return listFiles()
    .map((file) => {
      const post = readPost(file);
      return {
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.date,
        updated: post.updated,
        tags: post.tags,
        coverImage: post.coverImage,
        author: post.author,
        readingMinutes: post.readingMinutes,
        wordCount: post.wordCount,
        faqs: post.faqs,
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
