import Image from "next/image";
import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Element overrides for rendered Markdown.
 *
 * Written out rather than using a typography plugin so blog posts inherit the
 * same brand tokens as the rest of the app.
 */
export const mdxComponents = {
  h2: (props: ComponentProps<"h2">) => (
    <h2 className="mt-10 scroll-mt-24 text-2xl font-bold tracking-tight text-foreground" {...props} />
  ),
  h3: (props: ComponentProps<"h3">) => (
    <h3 className="mt-8 scroll-mt-24 text-lg font-semibold tracking-tight text-foreground" {...props} />
  ),
  p: (props: ComponentProps<"p">) => (
    <p className="mt-4 leading-relaxed text-foreground/90" {...props} />
  ),
  ul: (props: ComponentProps<"ul">) => (
    <ul className="mt-4 list-disc space-y-2 pl-5 text-foreground/90 marker:text-primary" {...props} />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol className="mt-4 list-decimal space-y-2 pl-5 text-foreground/90 marker:text-primary" {...props} />
  ),
  li: (props: ComponentProps<"li">) => <li className="leading-relaxed" {...props} />,
  /**
   * Internal links stay client-routed; anything off-site opens in a new tab
   * and is marked `nofollow`.
   *
   * Posts cite outside sources — state agriculture departments, veterinary
   * associations, census data — and those citations are what make the claims
   * checkable. But none of them should inherit Petnote's link equity, so the
   * rel is applied here at the renderer rather than trusted to every author
   * remembering it in Markdown. `noopener noreferrer` comes along because the
   * link is targeting a new tab.
   */
  a: ({ href = "", ...props }: ComponentProps<"a">) =>
    href.startsWith("/") || href.startsWith("#") ? (
      <Link href={href} className="font-medium text-primary underline underline-offset-4" {...props} />
    ) : (
      <a
        href={href}
        className="font-medium text-primary underline underline-offset-4"
        target="_blank"
        rel="nofollow noopener noreferrer"
        {...props}
      />
    ),
  /**
   * Markdown images become next/image so posts get the same lazy loading and
   * responsive sizing as the rest of the app instead of a raw <img>.
   *
   * Intrinsic dimensions aren't known from Markdown, so this uses fill inside
   * a ratio box rather than inventing width and height attributes.
   */
  img: ({ src, alt = "" }: ComponentProps<"img">) =>
    typeof src === "string" && src.length > 0 ? (
      <figure className="mt-6">
        <span className="relative block aspect-[16/9] overflow-hidden rounded-xl border border-border">
          <Image
            src={src}
            alt={alt}
            fill
            loading="lazy"
            sizes="(min-width: 768px) 48rem, 100vw"
            className="object-cover"
          />
        </span>
        {alt ? (
          <figcaption className="mt-2 text-center text-sm text-muted-foreground">{alt}</figcaption>
        ) : null}
      </figure>
    ) : null,
  strong: (props: ComponentProps<"strong">) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote
      className="mt-6 rounded-r-lg border-l-4 border-fresh bg-fresh-soft/50 px-5 py-4 text-foreground/90"
      {...props}
    />
  ),
  table: (props: ComponentProps<"table">) => (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props: ComponentProps<"th">) => (
    <th
      className="border-b border-border bg-muted px-3 py-2 text-left font-semibold text-foreground"
      {...props}
    />
  ),
  td: (props: ComponentProps<"td">) => (
    <td className="border-b border-border px-3 py-2 align-top text-foreground/90" {...props} />
  ),
  code: (props: ComponentProps<"code">) => (
    <code className="rounded bg-muted px-1.5 py-0.5 text-[0.9em] text-primary" {...props} />
  ),
  hr: (props: ComponentProps<"hr">) => <hr className="my-10 border-border" {...props} />,
};
