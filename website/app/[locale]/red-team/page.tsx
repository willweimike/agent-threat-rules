import { Reveal } from "@/components/Reveal";
import { loadSiteStats } from "@/lib/stats";
import { locales, type Locale } from "@/lib/i18n";
import type { Metadata } from "next";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Red Team — Your attack becomes the standard | ATR",
  description:
    "ATR is the only public detection standard built from red-team research. Your discovered probe becomes a permanent rule, auto-propagating to Microsoft Agent Governance Toolkit, Cisco AI Defense, MISP, and OWASP within hours. Attribution stays attached. Forever.",
};

interface RedTeamTool {
  name: string;
  status: "in-production" | "in-review" | "corpus";
  org: string;
  homepage: string;
  prUrl?: string;
  hook: string;
  what_atr_did: string;
}

const RED_TEAM_TOOLS: RedTeamTool[] = [
  {
    name: "NVIDIA Garak",
    org: "NVIDIA AI Red Team",
    status: "in-review",
    homepage: "https://github.com/NVIDIA/garak",
    prUrl: "https://github.com/NVIDIA/garak/pull/1676",
    hook: "The reference open-source LLM vulnerability scanner. 50+ probe families, jmartin-tech + leondz maintainers.",
    what_atr_did:
      "Wrapped 330 ATR rules as garak detectors. PR #1676 cleared two review rounds; in-the-wild benchmark posted 97.1% recall (646/666) on garak's own community jailbreak corpus.",
  },
  {
    name: "Microsoft PyRIT",
    org: "Microsoft AI Red Team",
    status: "in-review",
    homepage: "https://github.com/microsoft/PyRIT",
    prUrl: "https://github.com/microsoft/PyRIT/pull/1715",
    hook: "The toolkit Microsoft uses internally to red-team production LLM products. Roman Lutz leads.",
    what_atr_did:
      "Added an ATR dataset loader exposing the rule corpus as PyRIT attack sources. Roman reviewed within 2 min on first push; iterating on doc shape.",
  },
  {
    name: "HackAPrompt",
    org: "Learn Prompting",
    status: "corpus",
    homepage: "https://hackaprompt.com",
    prUrl: "https://github.com/Agent-Threat-Rule/agent-threat-rules/pull/51",
    hook: "The largest crowd-sourced prompt-injection competition corpus, ~600k attack attempts across all GPT/Claude/PaLM versions.",
    what_atr_did:
      "Clustered the HackAPrompt corpus by attack family and shipped 6 ATR rules (ATR-2026-00442..00447) covering the dominant clusters. Each rule cites the HackAPrompt cluster in its provenance.",
  },
  {
    name: "PromptInject",
    org: "agencyenterprise · NeurIPS 2022 Best Paper",
    status: "in-review",
    homepage: "https://github.com/agencyenterprise/PromptInject",
    prUrl: "https://github.com/agencyenterprise/PromptInject/issues/9",
    hook: "The original academic benchmark that started prompt-injection research. 8.2k stars; cited by every prompt-injection paper since.",
    what_atr_did:
      "Issue #9 proposes a corpus-to-ATR pipeline turning every PromptInject attack into a paired ATR rule. The reference academic benchmark gets defensive parity.",
  },
  {
    name: "Promptfoo",
    org: "Promptfoo Inc.",
    status: "in-review",
    homepage: "https://github.com/promptfoo/promptfoo",
    prUrl: "https://github.com/promptfoo/promptfoo/pull/8529",
    hook: "10k stars, used by red teams at Klarna, Discord, Anduril. Promptfoo runs adversarial tests; ATR catches what Promptfoo found.",
    what_atr_did:
      "PR #8529 adds an MCP red-team example using ATR as the deterministic defense layer. Promptfoo runs the probe; ATR rules return the verdict.",
  },
  {
    name: "Damn Vulnerable MCP Server",
    org: "harishsg993010",
    status: "in-review",
    homepage: "https://github.com/harishsg993010/damn-vulnerable-MCP-server",
    prUrl:
      "https://github.com/harishsg993010/damn-vulnerable-MCP-server/pull/29",
    hook: "A CTF-style training target with 10 intentionally-vulnerable MCP scenarios. The DVWA of agent security.",
    what_atr_did:
      "PR #29 ships the blue-team detection guide — every CTF challenge gets a paired ATR rule so trainees learn detection alongside the attack.",
  },
];

interface AttributionStat {
  number: string;
  label: string;
  detail: string;
}

const ATTRIBUTION_STATS: AttributionStat[] = [
  {
    number: "344",
    label: "ATR rules in production",
    detail:
      "Every one carries a discovered_by field. Microsoft AGT, Cisco AI Defense, MISP, OWASP A-S-R-H all preserve it when they sync.",
  },
  {
    number: "<24h",
    label: "From PR merge to Microsoft AGT",
    detail:
      "AGT's weekly auto-sync workflow ingests ATR main within 24h of any rule merge. CVE-2026-26030 closed end-to-end in 2h 16m.",
  },
  {
    number: "0 FP",
    label: "Required on 1,784 benign samples",
    detail:
      "Quality gate blocks any rule that fires on benign skill descriptions, arxiv abstracts, npm/pypi READMEs, or research-mention text.",
  },
];

interface ContributorBenefit {
  for: string;
  benefit: string;
  proof: string;
}

const CONTRIBUTOR_BENEFITS: ContributorBenefit[] = [
  {
    for: "Academic researchers",
    benefit:
      "Citable artifact paired with your attack. Concrete adoption metrics for your CV: number of rules, downstream consumers, fire counts in production telemetry.",
    proof:
      "Your name appears in the rule file's author + metadata_provenance.discovered_by. When MISP exports the taxonomy to STIX, your attribution propagates. When NIST cites the rule in a publication (in-progress with iMichaela at NIST OSCAL), the lineage is intact.",
  },
  {
    for: "Corporate red teams",
    benefit:
      "Your adversarial work becomes the defensive standard before competitors. Your team shows up as the discoverer in 350+ rules consumed by every major AI-security platform.",
    proof:
      "Microsoft's Copilot SWE Agent already opens PRs presuming ATR coverage (AGT #1981, closed 2026-05-11). Being the originator of ATR-2026-NNNNN rules is a real authority signal in vendor-eval conversations.",
  },
  {
    for: "Independent researchers",
    benefit:
      "Ship detection without writing regex. Submit positive + negative examples — auto-regex tries 4 variants against the full gate, ~30% pass on first attempt.",
    proof:
      "Auto-regex deterministic generator clears 0 FP across 3,551 samples (benign + extended + research-mention + cross-rule). The PR labels itself gate-passed and goes straight to maintainer review.",
  },
  {
    for: "Bug bounty hunters",
    benefit:
      "A second income stream for the same attack: the bug-bounty payout AND a permanent detection rule. Combines well with Huntr.dev, Hackerone AI scope, Protect AI bounty programmes.",
    proof:
      "ATR proposals are MIT-licensed and citable. No NDA conflict — the bounty programme owns the responsible-disclosure window; ATR ships detection after disclosure with public attribution.",
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

  const inProduction = RED_TEAM_TOOLS.filter(
    (t) => t.status === "in-production" || t.status === "corpus",
  );
  const inReview = RED_TEAM_TOOLS.filter((t) => t.status === "in-review");

  return (
    <div className="pt-20 pb-24">
      {/* ============================================================
          HERO — bigger frame, less density
      ============================================================ */}
      <section className="px-6 max-w-[1120px] mx-auto mb-24 md:mb-32">
        <Reveal>
          <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-6">
            {zh ? "獻給紅隊" : "For red teams"}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="font-display text-[clamp(36px,6vw,72px)] font-extrabold tracking-[-3px] leading-[1.02] mb-8 max-w-[860px]">
            {zh ? (
              <>
                你找到的攻擊
                <br />
                不該死在 PDF 裡。
              </>
            ) : (
              <>
                Your attack
                <br />
                shouldn&apos;t die in a PDF.
              </>
            )}
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="font-display text-[clamp(18px,2.2vw,24px)] text-stone font-light leading-snug mb-10 max-w-[720px]">
            {zh
              ? "ATR 是唯一公開把紅隊研究變成偵測標準的橋。Microsoft Agent Governance Toolkit、Cisco AI Defense、MISP、OWASP A-S-R-H 每週自動同步。你的攻擊變成一條規則，幾小時內進每一個主要 AI 安全平台 — 你的名字一直在。"
              : "ATR is the only public detection standard built from red-team research. Microsoft Agent Governance Toolkit, Cisco AI Defense, MISP, and OWASP A-S-R-H auto-sync weekly. Your attack becomes a rule that ships to every major AI security platform within hours. Your name stays attached. Forever."}
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/Agent-Threat-Rule/agent-threat-rules/issues/new?template=red-team-probe.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-ink text-paper px-7 py-3 rounded-sm text-base font-semibold hover:bg-ink/85 transition-colors"
            >
              {zh ? "送一個 probe →" : "Submit a probe →"}
            </a>
            <a
              href="#how-it-works"
              className="border border-fog text-ink px-7 py-3 rounded-sm text-base font-semibold hover:bg-ash/40 transition-colors"
            >
              {zh ? "看流程 →" : "See how it works →"}
            </a>
          </div>
        </Reveal>
      </section>

      {/* ============================================================
          THE BIG NUMBERS — three confident hits, lots of whitespace
      ============================================================ */}
      <section className="px-6 max-w-[1120px] mx-auto mb-24 md:mb-32">
        <Reveal>
          <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-10">
            {zh ? "為什麼這值得貢獻" : "Why this is worth your time"}
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {ATTRIBUTION_STATS.map((s, i) => (
            <Reveal key={i} delay={0.1 + i * 0.1}>
              <div className="border-l-2 border-blue pl-6">
                <div className="font-display text-[clamp(40px,5vw,64px)] font-extrabold tracking-[-2px] text-ink mb-2 leading-none">
                  {s.number}
                </div>
                <div className="font-display text-base font-semibold text-ink mb-3">
                  {s.label}
                </div>
                <p className="text-sm text-stone leading-relaxed">{s.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================================================
          WHAT YOU GET — the value prop, segmented by who you are
      ============================================================ */}
      <section className="px-6 max-w-[1120px] mx-auto mb-24 md:mb-32">
        <Reveal>
          <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-4">
            {zh ? "你能拿到什麼" : "What you get"}
          </div>
          <h2 className="font-display text-[clamp(28px,4vw,44px)] font-extrabold tracking-[-2px] leading-[1.05] mb-12 max-w-[720px]">
            {zh
              ? "依你是誰，紅隊貢獻有四種具體報酬。"
              : "Four concrete payoffs depending on who you are."}
          </h2>
        </Reveal>
        <div className="space-y-8">
          {CONTRIBUTOR_BENEFITS.map((b, i) => (
            <Reveal key={i} delay={0.05 + i * 0.05}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 py-6 border-t border-fog">
                <div className="md:col-span-3">
                  <div className="font-data text-xs text-stone tracking-wide mb-1 uppercase">
                    {zh ? "適用對象" : "For"}
                  </div>
                  <div className="font-display text-base font-semibold text-ink">
                    {b.for}
                  </div>
                </div>
                <div className="md:col-span-9">
                  <p className="text-base text-ink leading-relaxed mb-3 font-medium">
                    {b.benefit}
                  </p>
                  <p className="text-sm text-stone leading-relaxed">
                    {b.proof}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS — auto-regex highlighted
      ============================================================ */}
      <section
        id="how-it-works"
        className="bg-ink text-paper px-6 py-20 md:py-24 mb-24 md:mb-32"
      >
        <div className="max-w-[1120px] mx-auto">
          <Reveal>
            <div className="font-data text-xs font-medium text-paper/60 tracking-[3px] uppercase mb-4">
              {zh
                ? "送一個 probe 之後會發生什麼"
                : "What happens after you submit"}
            </div>
            <h2 className="font-display text-[clamp(28px,4vw,44px)] font-extrabold tracking-[-2px] leading-[1.05] mb-12 max-w-[720px]">
              {zh
                ? "Probe 進來、auto-regex 自動產、quality gate 全綠才 merge。"
                : "Probe in. Auto-regex generates. Quality gate validates. Merge if green."}
            </h2>
          </Reveal>

          <div className="space-y-12">
            <Reveal delay={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-2 font-display text-5xl font-extrabold text-paper/40 leading-none">
                  01
                </div>
                <div className="md:col-span-10">
                  <h3 className="font-display text-xl font-bold mb-3">
                    {zh ? "你填表單" : "You fill the form"}
                  </h3>
                  <p className="text-base text-paper/80 leading-relaxed mb-2">
                    {zh
                      ? "3 個攻擊樣本、3 個 benign lookalike、攻擊類別、來源論文/repo。3-5 分鐘。"
                      : "3 attack samples, 3 benign lookalikes, attack category, source paper / repo. Takes 3-5 minutes."}
                  </p>
                  <p className="text-sm text-paper/60">
                    {zh
                      ? "沒有 schema 要學、沒有 YAML 要寫、不用 fork repo。"
                      : "No schema to learn. No YAML to write. No fork."}
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-2 font-display text-5xl font-extrabold text-paper/40 leading-none">
                  02
                </div>
                <div className="md:col-span-10">
                  <h3 className="font-display text-xl font-bold mb-3">
                    {zh
                      ? "Auto-regex 跑 4 個變體"
                      : "Auto-regex tries 4 variants"}
                  </h3>
                  <p className="text-base text-paper/80 leading-relaxed mb-2">
                    {zh
                      ? "Deterministic n-gram set-cover algorithm 從你的 positive examples 萃取 distinctive phrases，建 alternation regex，加 word boundary、whitespace anchor 或 co-occurrence 約束 — 每個變體跑完整 gate。"
                      : "Deterministic n-gram set-cover algorithm extracts distinctive phrases from your positives, builds an alternation regex, tightens with word boundaries / whitespace anchors / co-occurrence constraints. Each variant runs through the full gate."}
                  </p>
                  <p className="text-sm text-paper/60">
                    {zh
                      ? "Gate = 自己 TP 必須 100% 命中 + 1,784 樣本 benign corpus 0 FP + 157 樣本 research-mention 0 FP + 跨規則 0 衝突。"
                      : "Gate = your TPs must match 100% + 1,784-sample benign corpus 0 FP + 157-sample research-mention 0 FP + 0 cross-rule conflicts."}
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-2 font-display text-5xl font-extrabold text-paper/40 leading-none">
                  03
                </div>
                <div className="md:col-span-10">
                  <h3 className="font-display text-xl font-bold mb-3">
                    {zh
                      ? "Gate 過了 → 完整規則送 PR"
                      : "Gate clears → complete rule on a PR"}
                  </h3>
                  <p className="text-base text-paper/80 leading-relaxed mb-2">
                    {zh
                      ? "PR 帶 gate-passed label。Maintainer 看 regex shape 是否太字面、需不需要 generalize — 通常 1-3 天 merge。沒過就留 stub，maintainer 手寫 regex（仍然會用你的 test cases）。"
                      : "PR lands with the gate-passed label. Maintainer reviews regex shape — is it too literal, can it generalize? Usually merged within 1-3 days. If gate didn't clear, stays as stub and a maintainer hand-crafts the regex (still using your test cases as ground truth)."}
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-2 font-display text-5xl font-extrabold text-paper/40 leading-none">
                  04
                </div>
                <div className="md:col-span-10">
                  <h3 className="font-display text-xl font-bold mb-3">
                    {zh
                      ? "規則自動往下游傳"
                      : "Rule auto-propagates downstream"}
                  </h3>
                  <p className="text-base text-paper/80 leading-relaxed mb-2">
                    {zh
                      ? "Microsoft AGT 每週 sync、Cisco AI Defense 跟 release tag、MISP taxonomy + galaxy 每次 release 拉、OWASP A-S-R-H 在 fixture 中引用 rule ID。你的 discovered_by 跟著整條鏈傳遞。"
                      : "Microsoft AGT syncs weekly. Cisco AI Defense pins to release tags. MISP taxonomy + galaxy pull on every release. OWASP A-S-R-H references rule IDs in fixtures. Your discovered_by field propagates through the whole chain."}
                  </p>
                  <p className="text-sm text-paper/60">
                    {zh
                      ? "Microsoft Semantic Kernel CVE 從 disclosure 到 v2.1.2 publish 用了 2 小時 16 分鐘。這就是 cadence。"
                      : "Microsoft Semantic Kernel CVE went from public disclosure to v2.1.2 npm publish in 2h 16m. That's the cadence."}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          RED TEAM TOOLS IN MOTION — only actual red team tooling
      ============================================================ */}
      <section className="px-6 max-w-[1120px] mx-auto mb-24 md:mb-32">
        <Reveal>
          <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-4">
            {zh ? "已經在跑的紅隊整合" : "Red team tooling in motion"}
          </div>
          <h2 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-2px] leading-[1.05] mb-4 max-w-[720px]">
            {zh
              ? "我們把 ATR 接到紅隊這邊。你的工具可以是下一個。"
              : "ATR is wired into the red-team ecosystem. Your tool can be next."}
          </h2>
          <p className="text-base text-stone font-light max-w-[640px] mb-12">
            {zh
              ? "這些是真的紅隊工具（offensive testing）。防禦端框架在 /ecosystem。"
              : "These are red-team tools — offensive testing frameworks and adversarial corpora. Defensive frameworks live on /ecosystem."}
          </p>
        </Reveal>

        <Reveal>
          <div className="font-data text-xs font-medium text-stone tracking-[2px] uppercase mb-4">
            {zh
              ? `已整合 (${inProduction.length})`
              : `Integrated (${inProduction.length})`}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="space-y-px bg-fog mb-12">
            {inProduction.map((t) => (
              <div key={t.name} className="bg-paper p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-3">
                    <h3 className="font-display text-lg font-bold text-ink mb-1">
                      {t.name}
                    </h3>
                    <div className="font-data text-xs text-stone">{t.org}</div>
                    <div className="font-data text-xs text-green mt-2 uppercase tracking-wide">
                      {t.status === "corpus"
                        ? zh
                          ? "資料集已消化"
                          : "Corpus ingested"
                        : zh
                          ? "已整合"
                          : "Integrated"}
                    </div>
                  </div>
                  <div className="md:col-span-9">
                    <p className="text-sm text-stone leading-relaxed mb-2">
                      {t.hook}
                    </p>
                    <p className="text-base text-ink leading-relaxed mb-3">
                      {t.what_atr_did}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={t.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-data text-xs text-blue hover:underline"
                      >
                        {zh ? "工具 →" : "Tool →"}
                      </a>
                      {t.prUrl && (
                        <a
                          href={t.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-data text-xs text-blue hover:underline"
                        >
                          {zh ? "PR →" : "PR →"}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div className="font-data text-xs font-medium text-stone tracking-[2px] uppercase mb-4">
            {zh
              ? `審查中 (${inReview.length})`
              : `Under review (${inReview.length})`}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-fog">
            {inReview.map((t) => (
              <a
                key={t.name}
                href={t.prUrl ?? t.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-paper p-6 hover:bg-ash/30 transition-colors"
              >
                <div className="font-display text-base font-bold text-ink mb-1">
                  {t.name}
                </div>
                <div className="font-data text-xs text-stone mb-3">{t.org}</div>
                <p className="text-sm text-stone leading-relaxed mb-3">
                  {t.hook}
                </p>
                <p className="text-sm text-ink leading-relaxed">
                  {t.what_atr_did}
                </p>
              </a>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ============================================================
          PIPELINE PROOF — concrete: what passed last week
      ============================================================ */}
      <section className="px-6 max-w-[1120px] mx-auto mb-24 md:mb-32">
        <Reveal>
          <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-4">
            {zh ? "Pipeline 不是 vapor" : "Pipeline is not vapor"}
          </div>
          <h2 className="font-display text-[clamp(24px,3.4vw,36px)] font-extrabold tracking-[-2px] leading-tight mb-8 max-w-[680px]">
            {zh
              ? "Auto-regex 已經對你的範本 0 FP 跨 3,551 樣本。"
              : "Auto-regex already clears 0 FP across 3,551 samples on the sample probe."}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="bg-ash/40 border border-fog p-6 md:p-8 font-data text-xs md:text-sm text-ink overflow-x-auto">
            <pre className="whitespace-pre leading-relaxed">{`$ npx tsx scripts/auto-regex.ts \\
    --file proposals/red-team-probes/dan-trust-phrase-wrapping.proposal.yaml \\
    --write

[auto-regex] 3 TPs, 3 TNs — generating candidate regex…
[auto-regex] gate corpora: 431 benign + 1,352 extended + 157 research + 1,611 cross-rule TNs
[auto-regex] variant 0: 3 phrases, tp=100%, fp=0
  (benign=0 ext=0 res=0 cross=0) — PASS
[auto-regex] wrote regex to proposals/red-team-probes/...

::auto-regex-summary::
{ "passed": true, "variant": 0, "tp_coverage": 1, "total_fp": 0 }`}</pre>
          </div>
        </Reveal>
      </section>

      {/* ============================================================
          FINAL CTA — terse, confident
      ============================================================ */}
      <section className="px-6 max-w-[1120px] mx-auto">
        <Reveal>
          <div className="border border-ink p-8 md:p-12">
            <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-4">
              {zh ? "送一個 probe" : "Submit a probe"}
            </div>
            <h2 className="font-display text-[clamp(28px,4vw,44px)] font-extrabold tracking-[-2px] leading-[1.05] mb-6 max-w-[720px]">
              {zh
                ? "10 分鐘的填表 → 永久的署名 → 進每個主流 AI 安全平台。"
                : "10 minutes of form-filling. Permanent attribution. Ships to every major AI security platform."}
            </h2>
            <p className="text-base text-stone leading-relaxed mb-8 max-w-[640px]">
              {zh
                ? "MIT 授權、無 CLA、無遙測、永遠免費。你保留出版攻擊本身的所有權利 — ATR 只負責把它變成偵測。"
                : "MIT licensed. No CLA. No telemetry. Forever free. You retain every right to publish the attack itself — ATR only carries the detection."}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/Agent-Threat-Rule/agent-threat-rules/issues/new?template=red-team-probe.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-ink text-paper px-7 py-3 rounded-sm text-base font-semibold hover:bg-ink/85 transition-colors"
              >
                {zh ? "開 probe issue →" : "Open a probe issue →"}
              </a>
              <a
                href="https://github.com/Agent-Threat-Rule/agent-threat-rules"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-fog text-ink px-7 py-3 rounded-sm text-base font-semibold hover:bg-ash/40 transition-colors"
              >
                {zh ? "看 repo →" : "Read the repo →"}
              </a>
              <a
                href={`/${locale}/ecosystem`}
                className="border border-fog text-ink px-7 py-3 rounded-sm text-base font-semibold hover:bg-ash/40 transition-colors"
              >
                {zh
                  ? "防禦端在 /ecosystem →"
                  : "Defensive side at /ecosystem →"}
              </a>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-xs text-stone mt-6 max-w-[640px]">
            {zh
              ? `已部署 ${stats.ruleCount} 條規則，跨 ${stats.categoryCount} 個威脅類別。每條都有 author + metadata_provenance.discovered_by。`
              : `${stats.ruleCount} rules deployed across ${stats.categoryCount} threat categories. Every one has an author field and metadata_provenance.discovered_by intact.`}
          </p>
        </Reveal>
      </section>
    </div>
  );
}
