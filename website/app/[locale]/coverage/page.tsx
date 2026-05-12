import { loadCoverageData } from "@/lib/coverage";
import { loadSiteStats } from "@/lib/stats";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { StatsHydrator } from "@/components/StatsHydrator";
import { locales, t, type Locale } from "@/lib/i18n";
import Link from "next/link";
import type { Metadata } from "next";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Coverage - ATR",
  description: "ATR coverage of OWASP Agentic Top 10, OWASP AST10, SAFE-MCP, and MITRE ATLAS frameworks.",
};

const STATUS_COLORS: Record<string, string> = {
  STRONG: "bg-green/10 text-green",
  MODERATE: "bg-blue/10 text-blue",
  PARTIAL: "bg-medium/10 text-medium",
  GAP: "bg-stone/10 text-stone",
};

export default async function CoveragePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (locales.includes(raw as Locale) ? raw : "en") as Locale;
  const coverage = loadCoverageData();
  const stats = loadSiteStats();

  return (
    <div className="pt-20 pb-16 px-6 max-w-[1120px] mx-auto">
      <StatsHydrator />
      <Reveal>
        <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-3">{t(locale, "coverage.label")}</div>
      </Reveal>
      <Reveal delay={0.1}>
        <h1 className="font-display text-[clamp(28px,4vw,44px)] font-extrabold tracking-[-2px] mb-2">
          {t(locale, "coverage.heading")}
        </h1>
      </Reveal>
      <Reveal delay={0.2}>
        <p className="text-base text-stone font-light mb-10">
          {t(locale, "coverage.sub")}
        </p>
      </Reveal>

      {/* How to read this */}
      <Reveal delay={0.25}>
        <div className="bg-ash border border-fog p-5 md:p-6 mb-8">
          <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-3">
            {locale === "zh" ? "如何解讀這些數字" : "How to read this"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-graphite leading-[1.7]">
            {[
              {
                name: "PINT (850 samples)",
                verdict: locale === "zh"
                  ? "ATR 在 PINT 的 850 個 MCP 對抗性樣本上達到 99.6% 精準度、0.25% FP——代表規則在真實 MCP 流量中幾乎不誤報。"
                  : "ATR reaches 99.6% precision and 0.25% FP on PINT's 850 MCP adversarial samples — rules rarely fire on legitimate MCP traffic.",
              },
              {
                name: "HackAPrompt (4,780 samples)",
                verdict: locale === "zh"
                  ? "ATR 在 4,780 個 HackAPrompt 競賽樣本上達到 66.2% 召回率、100% 精準度——每 3 次攻擊就能抓到 2 次，且不誤報。"
                  : "ATR catches 66.2% of the 4,780 HackAPrompt competition samples at 100% precision — roughly 2-in-3 attacks caught with no false alarms.",
              },
              {
                name: "SKILL.md (341 samples)",
                verdict: locale === "zh"
                  ? "ATR 在 341 個真實 SKILL.md 樣本上達到 100% 精準度、0% FP——對 MCP skill 定義的偵測沒有誤報。"
                  : "ATR reaches 100% precision and 0% FP on 341 real-world SKILL.md samples — no false positives on legitimate MCP skill definitions.",
              },
              {
                name: "garak (3,475 prompts)",
                verdict: locale === "zh"
                  ? "ATR 對 garak 社群 jailbreak 語料庫達到 97.1% 召回率——ATR 核心規則族群覆蓋了 garak 探測的 ~80% 以上。"
                  : "ATR reaches 97.1% recall on garak's community jailbreak corpus — ATR-core rule families cover ~80%+ of what garak probes.",
              },
            ].map((item) => (
              <div key={item.name}>
                <div className="font-data text-xs text-blue font-semibold mb-1">{item.name}</div>
                <p>{item.verdict}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Summary cards */}
      <Reveal delay={0.3}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-fog mb-12">
          <div className="bg-paper p-6 text-center">
            <div className="font-data text-xs text-stone tracking-[2px] uppercase mb-2">OWASP Agentic</div>
            <div className="font-data text-3xl font-bold text-ink">{stats.owaspAgentic}</div>
          </div>
          <div className="bg-paper p-6 text-center">
            <div className="font-data text-xs text-stone tracking-[2px] uppercase mb-2">SAFE-MCP</div>
            <div className="font-data text-3xl font-bold text-ink">{stats.safeMcp}</div>
          </div>
          <div className="bg-paper p-6 text-center">
            <div className="font-data text-xs text-stone tracking-[2px] uppercase mb-2">OWASP AST10</div>
            <div className="font-data text-3xl font-bold text-ink">{stats.owaspAst10}</div>
          </div>
          <div className="bg-paper p-6 text-center">
            <div className="font-data text-xs text-stone tracking-[2px] uppercase mb-2">PINT F1</div>
            <div className="font-data text-3xl font-bold text-ink"><CountUp target={stats.pintF1} liveKey="pintF1" /></div>
          </div>
        </div>
      </Reveal>

      {/* OWASP Agentic Top 10 */}
      <Reveal>
        <h2 className="font-display text-2xl font-extrabold tracking-[-1px] mb-1 mt-12">OWASP Agentic Top 10</h2>
        <p className="text-sm text-stone mb-6">{coverage.owaspAgenticCovered}/10 {locale === "zh" ? "個類別已覆蓋。" : "categories covered."}</p>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="border border-fog">
          <div className="hidden md:grid grid-cols-[100px_1fr_100px_100px] bg-ash border-b border-fog">
            <div className="px-4 py-2.5 font-data text-xs text-stone uppercase tracking-wider font-semibold">ID</div>
            <div className="px-4 py-2.5 font-data text-xs text-stone uppercase tracking-wider font-semibold">{locale === "zh" ? "類別" : "Category"}</div>
            <div className="px-4 py-2.5 font-data text-xs text-stone uppercase tracking-wider font-semibold">{locale === "zh" ? "規則數" : "Rules"}</div>
            <div className="px-4 py-2.5 font-data text-xs text-stone uppercase tracking-wider font-semibold">{locale === "zh" ? "狀態" : "Status"}</div>
          </div>
          {coverage.owaspAgentic.map((m) => (
            <div key={m.id} className="grid grid-cols-1 md:grid-cols-[100px_1fr_100px_100px] border-b border-fog last:border-b-0 hover:bg-ash/50 transition-colors">
              <div className="px-4 py-3 font-data text-sm text-blue">{m.id}</div>
              <div className="px-4 py-3 text-sm text-ink">{m.category}</div>
              <div className="px-4 py-3 font-data text-sm text-ink">{m.ruleCount}</div>
              <div className="px-4 py-3">
                <span className={`font-data text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-sm ${STATUS_COLORS[m.status] ?? ""}`}>
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* OWASP AST10 */}
      <Reveal>
        <h2 className="font-display text-2xl font-extrabold tracking-[-1px] mb-1 mt-12">OWASP Agentic Skills Top 10 (AST10)</h2>
        <p className="text-sm text-stone mb-6">{coverage.ast10Covered}/10 {locale === "zh" ? "個類別有規則覆蓋。3 個類別屬於流程/元層級（無法用模式偵測）。" : "categories with rule coverage. 3 categories are process/meta-level (not pattern-detectable)."}</p>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="border border-fog">
          <div className="hidden md:grid grid-cols-[100px_1fr_100px_100px] bg-ash border-b border-fog">
            <div className="px-4 py-2.5 font-data text-xs text-stone uppercase tracking-wider font-semibold">ID</div>
            <div className="px-4 py-2.5 font-data text-xs text-stone uppercase tracking-wider font-semibold">{locale === "zh" ? "類別" : "Category"}</div>
            <div className="px-4 py-2.5 font-data text-xs text-stone uppercase tracking-wider font-semibold">{locale === "zh" ? "規則數" : "Rules"}</div>
            <div className="px-4 py-2.5 font-data text-xs text-stone uppercase tracking-wider font-semibold">{locale === "zh" ? "狀態" : "Status"}</div>
          </div>
          {coverage.owaspAst10.map((m) => (
            <div key={m.id} className="grid grid-cols-1 md:grid-cols-[100px_1fr_100px_100px] border-b border-fog last:border-b-0 hover:bg-ash/50 transition-colors">
              <div className="px-4 py-3 font-data text-sm text-blue">{m.id}</div>
              <div className="px-4 py-3 text-sm text-ink">{m.category}</div>
              <div className="px-4 py-3 font-data text-sm text-ink">{m.ruleCount}</div>
              <div className="px-4 py-3">
                <span className={`font-data text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-sm ${STATUS_COLORS[m.status] ?? ""}`}>
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* SAFE-MCP */}
      <Reveal>
        <h2 className="font-display text-2xl font-extrabold tracking-[-1px] mb-1 mt-12">SAFE-MCP (OpenSSF)</h2>
        <p className="text-sm text-stone mb-4">{locale === "zh" ? "85 項技術中已覆蓋 78 項（91.8%）。" : "78 of 85 techniques covered (91.8%)."}</p>
        <a
          href="https://github.com/Agent-Threat-Rule/agent-threat-rules/blob/main/docs/SAFE-MCP-MAPPING.md"
          target="_blank"
          rel="noopener noreferrer"
          className="font-data text-sm text-blue hover:underline"
        >
          {locale === "zh" ? "在 GitHub 查看完整 SAFE-MCP 對應表" : "View full SAFE-MCP mapping on GitHub"} &rarr;
        </a>
      </Reveal>

      {/* MITRE ATLAS */}
      <Reveal>
        <h2 className="font-display text-2xl font-extrabold tracking-[-1px] mb-1 mt-12">MITRE ATLAS</h2>
        <p className="text-sm text-stone mb-4">{locale === "zh" ? "每條規則的 YAML 中包含 MITRE ATLAS 參照。在規則瀏覽器中依戰術分組。" : "Per-rule MITRE ATLAS references in each rule YAML. Grouped by tactic in the rule explorer."}</p>
        <Link
          href={`/${locale}/rules`}
          className="font-data text-sm text-blue hover:underline"
        >
          {locale === "zh" ? "瀏覽含 MITRE 對應的規則" : "Browse rules with MITRE mappings"} &rarr;
        </Link>
      </Reveal>
    </div>
  );
}
