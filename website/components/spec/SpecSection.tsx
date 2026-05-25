import type { ReactNode } from "react";

interface SpecSectionProps {
  /** Section number like "1", "3.2", "3.2.1". */
  num: string;
  /** Section title (renders as h2 for top-level, h3 for sub). */
  title: string;
  /** "normative" or "informative" — drives the inline badge. */
  status?: "normative" | "informative";
  /** Slug for anchor id. Defaults to lowercased title. */
  id?: string;
  children: ReactNode;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Numbered spec section. Renders heading level based on depth of `num`.
 *   <SpecSection num="1" title="Background" /> → <h2>
 *   <SpecSection num="3.2" title="Detection Logic" /> → <h3>
 *   <SpecSection num="3.2.1" title="Subcondition" /> → <h4>
 */
export function SpecSection({
  num,
  title,
  status = "informative",
  id,
  children,
}: SpecSectionProps) {
  const depth = num.split(".").length;
  const anchorId = id ?? `section-${num.replace(/\./g, "-")}-${slugify(title)}`;
  const Heading: "h2" | "h3" | "h4" =
    depth === 1 ? "h2" : depth === 2 ? "h3" : "h4";

  return (
    <section id={anchorId} aria-labelledby={`${anchorId}-heading`}>
      <Heading id={`${anchorId}-heading`}>
        <a href={`#${anchorId}`} className="section-anchor" aria-hidden="true">
          §{num}
        </a>
        {title}
        {status === "normative" ? (
          <span
            className="spec-badge normative"
            style={{ marginLeft: "0.6rem", verticalAlign: "0.15em" }}
          >
            Normative
          </span>
        ) : null}
      </Heading>
      {children}
    </section>
  );
}
