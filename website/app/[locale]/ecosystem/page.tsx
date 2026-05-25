/**
 * /ecosystem is the legacy URL for the marketing-style adopter wall.
 * The new canonical location is /implementers — a formal W3C-style
 * Implementer Report.
 *
 * Static-export-compatible redirect: a meta-refresh in the head plus a
 * visible fallback link. Cloudflare Pages also serves a 301 via
 * public/_redirects.
 */
import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: "Implementers | ATR",
  description:
    "This page has moved to /implementers — the formal ATR Implementer Report.",
  robots: { index: false, follow: true },
};

export default async function EcosystemRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: l } = await params;
  const locale = (locales.includes(l as Locale) ? l : "en") as Locale;
  const target = `/${locale}/implementers`;

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 text-center"
      lang={locale === "zh" ? "zh-Hant" : "en"}
    >
      {/* Static-host redirect — works under output: export */}
      <meta httpEquiv="refresh" content={`0;url=${target}`} />
      <link rel="canonical" href={`https://agentthreatrule.org${target}`} />
      <div className="max-w-md">
        <p
          className="text-xs uppercase tracking-[0.18em] text-stone mb-3"
          style={{ fontFamily: "var(--font-data)" }}
        >
          {locale === "zh" ? "頁面已搬遷" : "Page moved"}
        </p>
        <h1
          className="text-2xl md:text-3xl font-bold text-navy-ink mb-4"
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.02em",
          }}
        >
          /ecosystem → /implementers
        </h1>
        <p
          className="text-base text-graphite mb-6"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {locale === "zh"
            ? "原行銷風格的 Ecosystem 牆已改寫為正式的 ATR Implementer Report。"
            : "The marketing-style Ecosystem page has been replaced by the formal ATR Implementer Report."}
        </p>
        <Link
          href={target}
          className="inline-flex items-center gap-2 px-5 py-3 bg-navy text-white text-sm font-medium rounded-sm hover:bg-navy-soft transition-colors"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {locale === "zh" ? "前往 Implementer Report" : "Go to Implementer Report"}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  );
}
