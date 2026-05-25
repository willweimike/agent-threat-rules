import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { SpecToC, type ToCEntry } from "./SpecToC";
import { DocumentStatus } from "./DocumentStatus";

interface SpecLayoutProps {
  locale: Locale;
  /** Title of the document (renders as h1 above status). */
  title: string;
  /** Optional one-line subtitle (abstract teaser). */
  subtitle?: string;
  /** Sections for the ToC sidebar. */
  toc: ToCEntry[];
  /** Optional override of the status banner. */
  statusOverride?: string;
  /** Main spec body. */
  children: ReactNode;
}

/**
 * Two-column layout for any spec-bearing page. Mobile: ToC collapses
 * to top of page above content. lg+: sticky left rail.
 */
export function SpecLayout({
  locale,
  title,
  subtitle,
  toc,
  statusOverride,
  children,
}: SpecLayoutProps) {
  return (
    <article
      className="spec-document w-full max-w-7xl mx-auto px-5 md:px-8 pt-24 md:pt-28 pb-24"
      lang={locale === "zh" ? "zh-Hant" : "en"}
    >
      <header className="mb-8 md:mb-10">
        <h1
          className="text-3xl md:text-4xl font-bold text-navy-ink mb-3 leading-tight"
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className="text-stone text-base md:text-lg mb-5"
            style={{ fontFamily: "var(--font-body)", maxWidth: "42em" }}
          >
            {subtitle}
          </p>
        ) : null}
        <DocumentStatus locale={locale} statusOverride={statusOverride} />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[14rem_minmax(0,1fr)] gap-10 lg:gap-12">
        <aside className="lg:order-first">
          <SpecToC locale={locale} entries={toc} />
        </aside>
        <div className="min-w-0 spec-measure-wide">{children}</div>
      </div>
    </article>
  );
}
