/**
 * Structured data for search engines and AI crawlers. `<` is escaped so text
 * from Sanity can't close the script tag (XSS).
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
