/**
 * Renders structured data as server-side markup.
 *
 * Deliberately a plain <script> in the component tree rather than next/head:
 * this subtree is server-rendered, so the JSON is in the initial HTML response
 * and is read by crawlers and answer engines that never run JavaScript.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify does not escape "<", so a "</script>" sequence inside
      // any string value would close this tag early. Escaping the angle
      // bracket keeps the payload valid JSON while making that impossible.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
