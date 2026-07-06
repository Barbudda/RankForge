/**
 * Renders a JSON-LD <script> from a plain object. Next.js has no first-class
 * Metadata-API field for structured data, so a server-rendered script tag is
 * the official, idiomatic pattern. The data is always trusted/static; the "<"
 * escape guards against accidental </script> breakout if a field ever changes.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
