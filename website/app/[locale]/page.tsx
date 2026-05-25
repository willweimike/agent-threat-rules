/* ATR Homepage — standards-document layout.
 * Replaces the 8-scene marketing narrative with a W3C-style cover page:
 * Document Status banner, abstract, mission, adoption table, spec download links.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { locales, type Locale, t } from "@/lib/i18n";
import { getSpecMeta } from "@/lib/spec-meta";
import { DocumentStatus } from "@/components/spec/DocumentStatus";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "ATR — Agent Threat Rules",
    description:
      locale === "zh"
        ? "AI Agent 安全威脅的開放偵測規則格式。廠商中立、機器可讀、可同儕審查。"
        : "Open detection rule format for AI agent security threats. Vendor-neutral, machine-readable, peer-reviewable.",
  };
}

// Implementer data — single source of truth, also referenced by /implementers
// detailed table. Keep this list short on the homepage; the full report
// lives at /implementers.
const IMPLEMENTERS = [
  {
    org: "Microsoft Agent Governance Toolkit",
    role: "L1 Engine",
    version: "3.0.0-alpha",
    date: "2026-04-26",
    refLabel: "PR #1277",
    refUrl: "https://github.com/microsoft/agent-governance-toolkit/pull/1277",
  },
  {
    org: "Cisco AI Defense (skill-scanner)",
    role: "L1 Engine",
    version: "2.2.0",
    date: "2026-04-22",
    refLabel: "PR #99",
    refUrl: "https://github.com/cisco-ai-defense/skill-scanner/pull/99",
  },
  {
    org: "MISP — CIRCL (galaxy)",
    role: "L1 Galaxy",
    version: "2.2.0",
    date: "2026-05-10",
    refLabel: "galaxy #1207",
    refUrl: "https://github.com/MISP/misp-galaxy/pull/1207",
  },
  {
    org: "MISP — CIRCL (taxonomies)",
    role: "L1 Citation",
    version: "2.2.0",
    date: "2026-05-10",
    refLabel: "taxonomies #323",
    refUrl: "https://github.com/MISP/misp-taxonomies/pull/323",
  },
  {
    org: "OWASP A-S-R-H Project",
    role: "L1 Citation",
    version: "2.2.0",
    date: "2026-05-11",
    refLabel: "PR #74",
    refUrl:
      "https://github.com/precize/Agentic-AI-Top10-Vulnerability/pull/74",
  },
  {
    org: "Gen Digital Sage (Norton / Avast / AVG)",
    role: "L1 Engine",
    version: "2.2.0",
    date: "2026-05-11",
    refLabel: "PR #33",
    refUrl: "https://github.com/gendigitalinc/sage/pull/33",
  },
  {
    org: "NIST OSCAL",
    role: "Path 1 Accepted",
    version: "2.2.0",
    date: "2026-05-10",
    refLabel: "ai-rmf-oscal-catalog",
    refUrl: "https://github.com/Agent-Threat-Rule/ai-rmf-oscal-catalog",
  },
] as const;

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: l } = await params;
  const locale = (locales.includes(l as Locale) ? l : "en") as Locale;
  const meta = getSpecMeta();
  const prefix = `/${locale}`;

  return (
    <main
      id="main-content"
      className="spec-document w-full max-w-7xl mx-auto px-5 md:px-8 pt-24 md:pt-28 pb-24"
      lang={locale === "zh" ? "zh-Hant" : "en"}
    >
      {/* Title block — large, W3C-style */}
      <header className="mb-8 md:mb-10 max-w-3xl">
        <p
          className="text-xs uppercase tracking-[0.18em] text-stone mb-3"
          style={{ fontFamily: "var(--font-data)" }}
        >
          {locale === "zh" ? "公開規格 — 草稿" : "Open Specification — Draft"}
        </p>
        <h1
          className="text-3xl md:text-5xl font-bold text-navy-ink mb-4 leading-[1.1]"
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.02em",
          }}
        >
          {t(locale, "home.title")}
        </h1>
        <p
          className="text-base md:text-xl text-graphite leading-snug mb-6"
          style={{
            fontFamily: "var(--font-body)",
            maxWidth: "42em",
          }}
        >
          {t(locale, "home.subtitle")}
        </p>
        <DocumentStatus locale={locale} />
      </header>

      {/* Primary CTAs — spec-language, not "Get Started" */}
      <div className="mb-12 md:mb-16 flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-2xl">
        <Link
          href={`${prefix}/spec`}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-navy text-white text-sm font-medium rounded-sm hover:bg-navy-soft transition-colors min-h-[44px]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t(locale, "home.cta.spec")}
          <span aria-hidden>→</span>
        </Link>
        <Link
          href="https://github.com/Agent-Threat-Rule/agent-threat-rules/blob/main/spec/atr-schema.yaml"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-paper text-navy-ink text-sm font-medium rounded-sm border border-fog hover:border-navy transition-colors min-h-[44px]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t(locale, "home.cta.schema")}
          <span aria-hidden>↗</span>
        </Link>
        <Link
          href={`${prefix}/implementers`}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-paper text-stone text-sm font-medium rounded-sm border border-fog hover:border-stone hover:text-ink transition-colors min-h-[44px]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t(locale, "home.cta.implementers")}
          <span aria-hidden>→</span>
        </Link>
      </div>

      {/* Spec body — two-column on desktop, single-column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[14rem_minmax(0,1fr)] gap-10 lg:gap-14">
        {/* ToC sidebar */}
        <aside aria-label="Table of contents" className="lg:order-first">
          <nav className="spec-toc">
            <p
              className="text-xs font-semibold uppercase tracking-wider text-stone mb-3"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {t(locale, "spec.toc")}
            </p>
            <ol>
              <li>
                <a href="#abstract">
                  <span className="toc-section-num">§1</span>
                  {t(locale, "spec.abstract.h")}
                </a>
              </li>
              <li>
                <a href="#mission">
                  <span className="toc-section-num">§2</span>
                  {t(locale, "mission.title")}
                </a>
              </li>
              <li>
                <a href="#adoption">
                  <span className="toc-section-num">§3</span>
                  {t(locale, "home.section.adoption")}
                </a>
              </li>
              <li>
                <a href="#get">
                  <span className="toc-section-num">§4</span>
                  {t(locale, "home.section.get")}
                </a>
              </li>
              <li>
                <a href="#vision">
                  <span className="toc-section-num">§5</span>
                  {t(locale, "vision.title")}
                </a>
              </li>
            </ol>
            <hr className="my-5 border-fog" />
            <p
              className="text-xs uppercase tracking-wider text-stone mb-2"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {locale === "zh" ? "完整規格" : "Full Specification"}
            </p>
            <Link
              href={`${prefix}/spec`}
              className="text-sm text-navy underline decoration-navy/30 hover:decoration-navy"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {t(locale, "spec.read_full")} →
            </Link>
          </nav>
        </aside>

        {/* Main body */}
        <div className="min-w-0 spec-measure-wide">
          {/* §1 Abstract */}
          <section id="abstract" aria-labelledby="abstract-heading">
            <h2 id="abstract-heading">
              <a
                href="#abstract"
                className="section-anchor"
                aria-hidden="true"
              >
                §1
              </a>
              {t(locale, "spec.abstract.h")}
            </h2>
            <p>{t(locale, "home.abstract")}</p>
          </section>

          {/* §2 Mission */}
          <section id="mission" aria-labelledby="mission-heading">
            <h2 id="mission-heading">
              <a
                href="#mission"
                className="section-anchor"
                aria-hidden="true"
              >
                §2
              </a>
              {t(locale, "mission.title")}
            </h2>
            <p>{t(locale, "mission.body")}</p>
            <p
              className="text-navy font-semibold not-italic"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                maxWidth: "32em",
              }}
            >
              {t(locale, "mission.tagline")}
            </p>
          </section>

          {/* §3 Adoption */}
          <section id="adoption" aria-labelledby="adoption-heading">
            <h2 id="adoption-heading">
              <a
                href="#adoption"
                className="section-anchor"
                aria-hidden="true"
              >
                §3
              </a>
              {t(locale, "home.section.adoption")}
            </h2>
            <p>{t(locale, "home.adoption.intro")}</p>

            {/* Desktop / tablet table */}
            <div className="hidden md:block overflow-x-auto -mx-2 my-5">
              <table>
                <thead>
                  <tr>
                    <th>{t(locale, "implementers.col.org")}</th>
                    <th>{t(locale, "implementers.col.role")}</th>
                    <th>{t(locale, "implementers.col.version")}</th>
                    <th>{t(locale, "implementers.col.date")}</th>
                    <th>{t(locale, "implementers.col.ref")}</th>
                  </tr>
                </thead>
                <tbody>
                  {IMPLEMENTERS.map((imp) => (
                    <tr key={imp.refUrl}>
                      <td className="font-semibold text-navy-ink">{imp.org}</td>
                      <td className="font-data text-xs tnum">{imp.role}</td>
                      <td className="font-data text-xs tnum">{imp.version}</td>
                      <td className="font-data text-xs tnum">{imp.date}</td>
                      <td>
                        <a
                          href={imp.refUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-navy underline"
                        >
                          {imp.refLabel} ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="md:hidden my-5 space-y-3">
              {IMPLEMENTERS.map((imp) => (
                <div
                  key={imp.refUrl}
                  className="border border-fog rounded-sm p-4 bg-paper"
                >
                  <p
                    className="font-semibold text-navy-ink mb-2"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {imp.org}
                  </p>
                  <dl
                    className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs tnum text-graphite mb-2"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    <dt className="text-stone">
                      {t(locale, "implementers.col.role")}
                    </dt>
                    <dd>{imp.role}</dd>
                    <dt className="text-stone">
                      {t(locale, "implementers.col.version")}
                    </dt>
                    <dd>{imp.version}</dd>
                    <dt className="text-stone">
                      {t(locale, "implementers.col.date")}
                    </dt>
                    <dd>{imp.date}</dd>
                  </dl>
                  <a
                    href={imp.refUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-navy underline text-sm"
                  >
                    {imp.refLabel} ↗
                  </a>
                </div>
              ))}
            </div>

            <p className="text-sm text-stone mt-4" style={{ maxWidth: "38em" }}>
              <Link
                href={`${prefix}/implementers`}
                className="text-navy underline"
              >
                {t(locale, "spec.implementer_report")} →
              </Link>
              {" — "}
              {locale === "zh"
                ? "完整實作者報告(含符規等級與整合 metadata)。"
                : "Full Implementer Report with conformance levels and integration metadata."}
            </p>
          </section>

          {/* §4 Get the spec */}
          <section id="get" aria-labelledby="get-heading">
            <h2 id="get-heading">
              <a href="#get" className="section-anchor" aria-hidden="true">
                §4
              </a>
              {t(locale, "home.section.get")}
            </h2>
            <p>{t(locale, "home.get.intro")}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-5 not-prose">
              <Link
                href={`${prefix}/spec`}
                className="block border border-fog hover:border-navy bg-paper p-4 rounded-sm transition-colors"
              >
                <p
                  className="text-xs uppercase tracking-wider text-stone mb-2"
                  style={{ fontFamily: "var(--font-data)" }}
                >
                  /spec
                </p>
                <p
                  className="font-semibold text-navy-ink"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {t(locale, "home.get.markdown")}
                </p>
              </Link>
              <a
                href="https://github.com/Agent-Threat-Rule/agent-threat-rules/blob/main/spec/atr-schema.yaml"
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-fog hover:border-navy bg-paper p-4 rounded-sm transition-colors"
              >
                <p
                  className="text-xs uppercase tracking-wider text-stone mb-2"
                  style={{ fontFamily: "var(--font-data)" }}
                >
                  spec/atr-schema.yaml
                </p>
                <p
                  className="font-semibold text-navy-ink"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {t(locale, "home.get.schema")} ↗
                </p>
              </a>
              <Link
                href={`${prefix}/citations`}
                className="block border border-fog hover:border-navy bg-paper p-4 rounded-sm transition-colors"
              >
                <p
                  className="text-xs uppercase tracking-wider text-stone mb-2"
                  style={{ fontFamily: "var(--font-data)" }}
                >
                  /citations
                </p>
                <p
                  className="font-semibold text-navy-ink"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {t(locale, "home.get.cite")}
                </p>
              </Link>
            </div>

            <p className="text-sm text-stone" style={{ maxWidth: "42em" }}>
              <span className="tnum">{meta.ruleCount}</span>{" "}
              {locale === "zh" ? "條規則,跨 " : "rules across "}
              <span className="tnum">{meta.ruleCategoryCount}</span>{" "}
              {locale === "zh"
                ? "個威脅類別。所有規則皆為 MIT 授權。永久。"
                : "threat categories. All rules MIT-licensed. In perpetuity."}
            </p>
          </section>

          {/* §5 Vision */}
          <section id="vision" aria-labelledby="vision-heading">
            <h2 id="vision-heading">
              <a href="#vision" className="section-anchor" aria-hidden="true">
                §5
              </a>
              {t(locale, "vision.title")}
            </h2>
            <p>{t(locale, "vision.body")}</p>
          </section>

          {/* End matter */}
          <hr className="my-12 border-fog" />
          <p className="spec-meta">
            {locale === "zh" ? "編輯" : "Editor"}: {meta.editors[0].name}
            {" <"}
            <a
              href={`mailto:${meta.editors[0].email}`}
              className="text-navy underline"
            >
              {meta.editors[0].email}
            </a>
            {">"} — DOI{" "}
            <a
              href={`https://doi.org/${meta.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy underline"
            >
              {meta.doi}
            </a>{" "}
            — MIT License — ISO 8601 {meta.lastModified}
          </p>
        </div>
      </div>
    </main>
  );
}
