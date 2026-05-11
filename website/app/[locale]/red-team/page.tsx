import { Reveal } from "@/components/Reveal";
import { loadSiteStats } from "@/lib/stats";
import { locales, type Locale } from "@/lib/i18n";
import type { Metadata } from "next";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Red Team Ecosystem — ATR",
  description:
    "Red teams find attacks. ATR turns them into deterministic detection. Integration patterns and invitations for garak, PyRIT, OWASP A-S-R-H, NeMo Guardrails, llm-guard, PromptInject, promptfoo, HackAPrompt, and more.",
};

interface IntegrationCard {
  name: string;
  status: "merged" | "open" | "consuming";
  org: string;
  detail: string;
  url: string;
  logo?: string;
}

const INTEGRATIONS: IntegrationCard[] = [
  {
    name: "OWASP Agent-Security-Regression-Harness",
    status: "merged",
    org: "OWASP Foundation",
    detail:
      'PR #74 merged 2026-05-11 by mertsatilmaz (OWASP Project Lead): "Welcome to the team." ATR detection wired into the OWASP regression harness so every red-team test case has a paired detection assertion.',
    url: "https://github.com/OWASP/Agent-Security-Regression-Harness/pull/74",
    logo: "https://github.com/OWASP.png?size=128",
  },
  {
    name: "Microsoft Agent Governance Toolkit",
    status: "merged",
    org: "Microsoft",
    detail:
      "Weekly auto-sync workflow ingests ATR rules into AGT. AGT #1981 (Microsoft Copilot SWE Agent) generated regression fixtures presuming ATR coverage — loop closed in 2h 16m: PR #50 merged, v2.1.2 published, fixtures mapped to rule IDs.",
    url: "https://github.com/microsoft/agent-governance-toolkit/pull/1981",
    logo: "https://github.com/microsoft.png?size=128",
  },
  {
    name: "HackAPrompt Cluster Coverage",
    status: "consuming",
    org: "Learn Prompting",
    detail:
      "6 rules (ATR-2026-00442..00447) generated from the HackAPrompt adversarial dataset clusters. Benchmark harness shipped in PR #51. Pattern: red-team corpus → cluster analysis → ATR YAML.",
    url: "https://github.com/Agent-Threat-Rule/agent-threat-rules/pull/51",
  },
  {
    name: "NVIDIA Garak",
    status: "open",
    org: "NVIDIA AI Red Team",
    detail:
      "PR #1676 open. 330 ATR detectors in garak. Two review rounds passed; final maintainer review in progress with jmartin-tech and leondz. In-the-wild benchmark: 97.1% recall (646/666 prompts) on garak's own community jailbreak corpus.",
    url: "https://github.com/NVIDIA/garak/pull/1676",
    logo: "https://github.com/NVIDIA.png?size=128",
  },
  {
    name: "Microsoft PyRIT",
    status: "open",
    org: "Microsoft AI Red Team",
    detail:
      "PR #1715 draft. ATR dataset loader for PyRIT red-team orchestrators — pulls ATR rule corpus and exposes it as PyRIT-compatible attack sources. Roman Lutz reviewed within 2 min; iterating on doc shape.",
    url: "https://github.com/microsoft/PyRIT/pull/1715",
    logo: "https://github.com/microsoft.png?size=128",
  },
  {
    name: "NVIDIA NeMo Guardrails",
    status: "open",
    org: "NVIDIA",
    detail:
      "Issue #1872. Colang rail loader proposal — turn ATR rules into reusable input/output rails inside NeMo Guardrails. One detection rule, one Colang rail, drop-in for any NeMo pipeline.",
    url: "https://github.com/NVIDIA/NeMo-Guardrails/issues/1872",
    logo: "https://github.com/NVIDIA.png?size=128",
  },
  {
    name: "Protect AI llm-guard",
    status: "open",
    org: "Protect AI",
    detail:
      "Issue #340. ATRScanner input/output scanner proposal following the existing scanner pattern. Wraps ATR engine as a llm-guard scanner that returns scores per category.",
    url: "https://github.com/protectai/llm-guard/issues/340",
  },
  {
    name: "PromptInject",
    status: "open",
    org: "agencyenterprise (NeurIPS Best Paper 2022)",
    detail:
      "Issue #9. Attack-source integration — turn the PromptInject adversarial corpus into ATR detection coverage. The reference academic prompt-injection benchmark gets paired ATR rules.",
    url: "https://github.com/agencyenterprise/PromptInject/issues/9",
  },
  {
    name: "Promptfoo",
    status: "open",
    org: "Promptfoo",
    detail:
      "PR #8529 open. MCP red-team example using ATR as the deterministic defense layer. Red-team probes from promptfoo, blocking rules from ATR.",
    url: "https://github.com/promptfoo/promptfoo/pull/8529",
  },
  {
    name: "Damn Vulnerable MCP Server",
    status: "open",
    org: "harishsg993010",
    detail:
      "PR #29 open. Blue-team detection guide for all 10 challenges — every CTF-style red-team scenario gets a matching ATR rule so teams can train detection alongside attack.",
    url: "https://github.com/harishsg993010/damn-vulnerable-MCP-server/pull/29",
  },
];

const PATTERNS = [
  {
    title_en: "Dataset loader",
    title_zh: "資料集載入器",
    body_en:
      "Expose ATR's rule corpus (true positives + true negatives + tags) as a dataset object in your framework. PyRIT-style orchestrators get a new attack source; your evaluation pipeline gets ground truth.",
    body_zh:
      "把 ATR 規則庫（true positives + true negatives + 標籤）做成你的框架可用的資料集物件。PyRIT 風格的 orchestrator 拿到新的 attack source；你的評估 pipeline 拿到 ground truth。",
    example: "PyRIT #1715 · NeMo Guardrails #1872",
  },
  {
    title_en: "Scanner / detector wrapper",
    title_zh: "Scanner / detector 包裝",
    body_en:
      "Wrap the ATR engine as one of your existing scanner / detector types. Inputs / outputs go through ATR; the framework gets category scores, severity, and matched-pattern provenance.",
    body_zh:
      "把 ATR 引擎包成你既有的 scanner / detector 型別。輸入 / 輸出 都過一次 ATR；framework 拿到分類分數、嚴重程度、matched-pattern 來源。",
    example: "garak #1676 (330 detectors) · llm-guard #340 (ATRScanner)",
  },
  {
    title_en: "Regression harness",
    title_zh: "Regression harness",
    body_en:
      'Every red-team test in your repo gets a paired detection assertion. The harness asserts both "attack succeeds against undefended model" and "ATR blocks the attack in the deny lane." Drift in either direction fails CI.',
    body_zh:
      '你 repo 裡每一個紅隊測試都配一個偵測 assertion。Harness 同時驗證 "攻擊對未防護模型成功" 和 "ATR 在 deny lane 擋住攻擊"。任一方向漂移都會讓 CI 失敗。',
    example: "OWASP Agent-Security-Regression-Harness #74 (merged)",
  },
  {
    title_en: "Corpus → rule pipeline",
    title_zh: "Corpus → rule pipeline",
    body_en:
      "Your adversarial dataset becomes ATR rules. Cluster the corpus by attack family; ATR autorscore + LLM review crystallises one regex per cluster; precision tests run against your benign corpus before merge.",
    body_zh:
      "把你的對抗資料集變成 ATR 規則。依攻擊家族分群；ATR autoscore + LLM review 為每個分群結晶出一條 regex；merge 前對你的 benign corpus 跑 precision 測試。",
    example:
      "HackAPrompt → ATR-2026-00442..00447 · CISA KEV sync · AVID-DB sync",
  },
];

export default async function RedTeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (locales.includes(raw as Locale) ? raw : "en") as Locale;
  const zh = locale === "zh";
  const stats = loadSiteStats();

  const merged = INTEGRATIONS.filter(
    (i) => i.status === "merged" || i.status === "consuming",
  );
  const open = INTEGRATIONS.filter((i) => i.status === "open");

  return (
    <div className="pt-20 pb-16 px-6 max-w-[1120px] mx-auto">
      {/* Header */}
      <Reveal>
        <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-3">
          {zh ? "紅隊生態系" : "Red Team Ecosystem"}
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <h1 className="font-display text-[clamp(28px,4vw,44px)] font-extrabold tracking-[-2px] mb-4">
          {zh
            ? "紅隊找出攻擊。ATR 把攻擊變成可執行的偵測。"
            : "Red teams find attacks. ATR turns them into deterministic detection."}
        </h1>
      </Reveal>
      <Reveal delay={0.2}>
        <p className="text-base text-stone font-light mb-10 max-w-[640px]">
          {zh
            ? `每一篇紅隊論文、每一個對抗資料集、每一個 CTF 挑戰，都應該配一條可重現的偵測規則。ATR 是 ${stats.ruleCount} 條 MIT 授權的 YAML 規則，跨 ${stats.categoryCount} 個威脅類別 — 你的紅隊工具可以直接吃 ATR、或把你的攻擊回灌成新規則。`
            : `Every red-team paper, every adversarial dataset, every CTF challenge deserves a reproducible detection rule. ATR is ${stats.ruleCount} MIT-licensed YAML rules across ${stats.categoryCount} threat categories — your red-team tool can consume ATR, or pipeline your attacks back into new rules.`}
        </p>
      </Reveal>

      {/* Why this page exists */}
      <Reveal>
        <div className="border-l-2 border-blue pl-5 mb-12 max-w-[720px]">
          <p className="text-sm text-ink leading-relaxed mb-2">
            {zh
              ? "紅隊跟偵測規則之間長期斷層。攻擊發表在論文，受害者在 issue tracker，偵測規則在 vendor 私有資料庫 — 沒有人對齊。"
              : "Red-teaming and detection have lived on different islands. Attacks publish to arXiv, victims file issues, detections live in vendor-private DBs. Nobody is aligned."}
          </p>
          <p className="text-sm text-stone leading-relaxed">
            {zh
              ? "ATR 是把這三層連起來的開放標準。Merge 一條 PR — 你的紅隊工具就跟 314 條 Cisco 在用的規則、330 條 garak detector、Microsoft AGT auto-sync 的規則庫對齊。"
              : "ATR is the open standard that connects the three. Merge one PR and your red-team tool aligns with the 314 rules Cisco ships, the 330 garak detectors, the AGT auto-sync feed Microsoft pulls weekly."}
          </p>
        </div>
      </Reveal>

      {/* Integrated section */}
      <Reveal>
        <div className="font-data text-xs font-medium text-stone tracking-[2px] uppercase mb-4">
          {zh
            ? `已整合 (${merged.length})`
            : `Already Integrated (${merged.length})`}
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="grid grid-cols-1 gap-px bg-fog mb-10">
          {merged.map((item) => (
            <div key={item.name} className="bg-paper p-6 md:p-8">
              <div className="flex items-start gap-4">
                {item.logo && (
                  <img
                    src={item.logo}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded-sm ring-1 ring-fog shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-3 mb-1">
                    <h2 className="font-display text-lg font-semibold text-ink">
                      {item.name}
                    </h2>
                    {item.status === "merged" && (
                      <span className="font-data text-xs text-green bg-green/10 px-2 py-0.5 rounded-sm uppercase">
                        {zh ? "已合併" : "merged"}
                      </span>
                    )}
                    {item.status === "consuming" && (
                      <span className="font-data text-xs text-blue bg-blue/10 px-2 py-0.5 rounded-sm uppercase">
                        {zh ? "已消費" : "consuming"}
                      </span>
                    )}
                  </div>
                  <div className="font-data text-xs text-stone mb-2">
                    {item.org}
                  </div>
                  <p className="text-sm text-stone mb-3">{item.detail}</p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-data text-xs text-blue hover:underline"
                  >
                    {zh ? "查看 →" : "View →"}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Under review */}
      <Reveal>
        <div className="font-data text-xs font-medium text-stone tracking-[2px] uppercase mb-4">
          {zh ? `審查中 (${open.length})` : `Under Review (${open.length})`}
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-fog mb-12">
          {open.map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-paper px-5 py-4 hover:bg-ash/50 transition-colors"
            >
              <div className="font-display text-sm font-semibold text-ink mb-1">
                {item.name}
              </div>
              <div className="font-data text-xs text-stone mb-1">
                {item.org}
              </div>
              <p className="text-xs text-stone">{item.detail}</p>
            </a>
          ))}
        </div>
      </Reveal>

      {/* Integration patterns */}
      <Reveal>
        <div className="font-data text-xs font-medium text-stone tracking-[2px] uppercase mb-2">
          {zh ? "整合模式" : "Integration Patterns"}
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
          {zh
            ? "四種模式涵蓋所有紅隊工具。"
            : "Four patterns cover every red-team tool."}
        </h2>
        <p className="text-sm text-stone mb-6 max-w-[640px]">
          {zh
            ? "選一個最貼近你工具形狀的模式 — 我們有現成範例可以照抄。"
            : "Pick whichever fits the shape of your tool — each one has a working reference you can copy."}
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-fog mb-12">
          {PATTERNS.map((p, i) => (
            <div key={i} className="bg-paper p-6">
              <div className="font-data text-xs text-stone mb-2">
                {zh ? `模式 ${i + 1}` : `Pattern ${i + 1}`}
              </div>
              <h3 className="font-display text-base font-semibold text-ink mb-2">
                {zh ? p.title_zh : p.title_en}
              </h3>
              <p className="text-sm text-stone mb-3">
                {zh ? p.body_zh : p.body_en}
              </p>
              <div className="font-data text-xs text-blue">{p.example}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* What you get */}
      <Reveal>
        <div className="font-data text-xs font-medium text-stone tracking-[2px] uppercase mb-2">
          {zh ? "整合後你得到什麼" : "What integration gives you"}
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight mb-6">
          {zh
            ? "三件你不用自己做的事。"
            : "Three things you no longer have to build."}
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-fog mb-12">
          <div className="bg-paper p-6">
            <div className="font-display text-3xl font-bold text-ink mb-2">
              {stats.ruleCount}
            </div>
            <div className="font-data text-xs text-stone mb-2 uppercase tracking-wide">
              {zh ? "規則" : "Rules"}
            </div>
            <p className="text-sm text-stone">
              {zh
                ? "覆蓋 prompt injection、tool poisoning、credential exfil、context exfil、model abuse、privilege escalation 等。每條規則對應到 CVE、OWASP、MITRE ATLAS。"
                : "Covering prompt injection, tool poisoning, credential exfil, context exfil, model abuse, privilege escalation, more. Each rule maps to CVE, OWASP, MITRE ATLAS."}
            </p>
          </div>
          <div className="bg-paper p-6">
            <div className="font-display text-3xl font-bold text-ink mb-2">
              {stats.pintPrecision}%
            </div>
            <div className="font-data text-xs text-stone mb-2 uppercase tracking-wide">
              {zh ? "Precision (PINT)" : "Precision (PINT)"}
            </div>
            <p className="text-sm text-stone">
              {zh
                ? `在 ${stats.pintSamples} 樣本的外部對抗 benchmark 上的 precision。我們也公開承認哪些攻擊 ATR 抓不到 — 重述、多語、protocol layer、multi-turn、未知攻擊。`
                : `Precision on the external adversarial PINT benchmark (${stats.pintSamples} samples). We also publish what ATR misses — paraphrase, multilingual, protocol-layer, multi-turn, novel attacks.`}
            </p>
          </div>
          <div className="bg-paper p-6">
            <div className="font-display text-3xl font-bold text-ink mb-2">
              MIT
            </div>
            <div className="font-data text-xs text-stone mb-2 uppercase tracking-wide">
              {zh ? "授權" : "License"}
            </div>
            <p className="text-sm text-stone">
              {zh
                ? "永遠 MIT — 寫進 GOVERNANCE.md。沒有 BSL、沒有 SSPL、沒有 CLA、沒有遙測、沒有付費等級。商用、再發布、fork 都可以。"
                : "Forever MIT — committed in GOVERNANCE.md. No BSL, no SSPL, no CLA, no telemetry, no paid tier. Commercial use, redistribution, forks all fine."}
            </p>
          </div>
        </div>
      </Reveal>

      {/* CTA */}
      <Reveal>
        <div className="border border-blue/20 bg-blue/[0.03] px-6 py-6 md:px-8 md:py-8">
          <div className="font-data text-xs font-medium text-blue tracking-[2px] uppercase mb-3">
            {zh ? "加入紅隊生態系" : "Join the Red Team Ecosystem"}
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-3">
            {zh
              ? "把你的紅隊工具接上 ATR。"
              : "Wire your red-team tool to ATR."}
          </h2>
          <p className="text-sm text-stone mb-6 max-w-[640px]">
            {zh
              ? "開一個 issue 描述你的工具 + 你想要的整合模式，我們會回覆 schema 跟範例 PR — 通常 24 小時內。或直接送 PR，附上你工具裡 ATR 怎麼被消費的最小可運行範例。"
              : "Open an issue describing your tool and the integration pattern you want — we reply with schema and a reference PR, usually within 24 hours. Or skip straight to a PR with the minimum working example of how ATR is consumed inside your tool."}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/Agent-Threat-Rule/agent-threat-rules/issues/new?title=Red+team+integration:+TOOL_NAME&body=Tool:+%0AHomepage:+%0AIntegration+pattern+(dataset+loader+/+scanner+wrapper+/+regression+harness+/+corpus-to-rule):+%0AReason+this+matters:+"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue text-white px-5 py-2.5 rounded-sm text-sm font-semibold hover:bg-blue-hover transition-colors"
            >
              {zh ? "開 Issue →" : "Open an issue →"}
            </a>
            <a
              href="https://github.com/Agent-Threat-Rule/agent-threat-rules"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-fog text-ink px-5 py-2.5 rounded-sm text-sm font-semibold hover:bg-ash/50 transition-colors"
            >
              {zh ? "看 repo →" : "View repo →"}
            </a>
            <a
              href={`/${locale}/integrate`}
              className="border border-fog text-ink px-5 py-2.5 rounded-sm text-sm font-semibold hover:bg-ash/50 transition-colors"
            >
              {zh ? "整合指南 →" : "Integration guide →"}
            </a>
          </div>
        </div>
      </Reveal>

      {/* Footer note */}
      <Reveal delay={0.1}>
        <p className="text-xs text-stone mt-8 max-w-[640px]">
          {zh
            ? "ATR 是社群維護的開放標準，MIT 授權，不隸屬於任何廠商。Red team ecosystem 是 ATR 的鄰居 — 不是子集、不是上游。我們把彼此的工作連起來，但每邊都保有自己的治理。"
            : "ATR is a community-maintained open standard, MIT-licensed, not affiliated with any vendor. The red-team ecosystem is ATR's neighbour — not a subset, not an upstream. We connect each other's work; each side keeps its own governance."}
        </p>
      </Reveal>
    </div>
  );
}
