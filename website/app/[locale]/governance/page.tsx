import { Reveal } from "@/components/Reveal";
import { locales, type Locale } from "@/lib/i18n";
import type { Metadata } from "next";
import Link from "next/link";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Governance — ATR",
  description:
    "ATR governance model: named maintainers, merge policy, succession plan, and conflict-of-interest disclosure between PanGuard AI Inc and the ATR community.",
};

export default async function GovernancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (locales.includes(raw as Locale) ? raw : "en") as Locale;
  const zh = locale === "zh";

  return (
    <div className="pt-20 pb-20 px-5 md:px-6 max-w-[860px] mx-auto">
      <Reveal>
        <div className="font-data text-[11px] md:text-xs font-medium text-stone tracking-[1.5px] md:tracking-[3px] uppercase mb-3">
          {zh ? "治理" : "Governance"}
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <h1 className="font-display text-[clamp(28px,4vw,48px)] font-extrabold tracking-[-2px] leading-[1.08] text-ink mb-4">
          {zh ? "ATR 的維護結構" : "How ATR is maintained"}
        </h1>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="text-base text-stone font-light max-w-[640px] leading-[1.8] mb-12">
          {zh
            ? "ATR 是 MIT 授權的開放標準，不隸屬任何公司。本頁說明誰維護這個標準、決策怎麼做、以及 PanGuard AI Inc 與 ATR 社群的利益衝突揭露。"
            : "ATR is an MIT-licensed open standard, not owned by any company. This page documents who maintains it, how decisions are made, and the conflict-of-interest disclosure between PanGuard AI Inc and the ATR community."}
        </p>
      </Reveal>

      {/* Current maintainers */}
      <Reveal>
        <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-3">
          {zh ? "現任維護者" : "Current maintainers"}
        </div>
        <h2 className="font-display text-xl font-extrabold tracking-[-0.5px] mb-6">
          {zh ? "負責規則品質、PR 審核、與發布。" : "Responsible for rule quality, PR review, and releases."}
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="border border-fog mb-12">
          <div className="p-6 md:p-8 border-b border-fog">
            <div className="flex flex-col md:flex-row md:items-start md:gap-8">
              <div className="md:w-48 flex-shrink-0 mb-4 md:mb-0">
                <div className="font-display text-base font-bold text-ink">Adam Lin</div>
                <div className="font-data text-xs text-stone mt-1">林冠辛</div>
                <div className="font-data text-xs text-blue mt-2">Lead Maintainer</div>
              </div>
              <div>
                <p className="text-sm text-graphite leading-[1.7] mb-3">
                  {zh
                    ? "ATR 的創始人與主要維護者。負責規則品質門檻設計（RFC-001）、社群外展、以及生態系整合審核。GitHub: eeee2345 (Adamthereal)。"
                    : "Founder and primary maintainer of ATR. Responsible for RFC-001 quality standard design, community outreach, and ecosystem integration review. GitHub: eeee2345 (Adamthereal)."}
                </p>
                <a
                  href="mailto:adam@agentthreatrule.org"
                  className="font-data text-xs text-blue hover:underline"
                >
                  adam@agentthreatrule.org
                </a>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8 bg-ash/30">
            <p className="text-sm text-stone leading-[1.7]">
              {zh
                ? "ATR 目前是單一維護者。我們正在積極招募第二位維護者——有興趣者請寄信至 adam@agentthreatrule.org。外部機構（LF、OpenSSF）的中立託管在路線圖上，目前未決。"
                : "ATR currently has one maintainer. We are actively recruiting a second. If you are interested, email adam@agentthreatrule.org. Neutral hosting under an external foundation (Linux Foundation, OpenSSF, or equivalent) is on the roadmap; no decision has been made."}
            </p>
          </div>
        </div>
      </Reveal>

      {/* Merge policy */}
      <Reveal>
        <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-3">
          {zh ? "合併政策" : "Merge policy"}
        </div>
        <h2 className="font-display text-xl font-extrabold tracking-[-0.5px] mb-4">
          {zh ? "每條規則要過六道關才能 merge。" : "Six gates before any rule merges."}
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="space-y-px bg-fog mb-12">
          {[
            {
              gate: zh ? "1 · 語法驗證" : "1 · Schema validation",
              desc: zh
                ? "合法 YAML schema、有效 regex（無 ReDoS）、至少 1 TP + 1 TN。"
                : "Valid YAML schema, valid regex (no ReDoS), at least 1 TP and 1 TN.",
            },
            {
              gate: zh ? "2 · RFC-001 品質門檻" : "2 · RFC-001 quality gate",
              desc: zh
                ? "信心分數公式（精準度 40% + wild 驗證 30% + 覆蓋深度 20% + 規避文件 10%）必須達到實驗門檻以上。"
                : "Confidence score formula (precision 40% + wild 30% + coverage 20% + evasion 10%) must clear the experimental threshold.",
            },
            {
              gate: zh ? "3 · 良性語料 0 FP" : "3 · Benign corpus 0 FP",
              desc: zh
                ? "在 432 個真實 benign skill 上 false positive rate 必須為 0。"
                : "False positive rate must be 0 on 432 real-world benign skills.",
            },
            {
              gate: zh ? "4 · 跨規則衝突檢查" : "4 · Cross-rule conflict check",
              desc: zh
                ? "新規則不得與現有規則在相同輸入產生矛盾結果。"
                : "New rule must not conflict with existing rules on the same input.",
            },
            {
              gate: zh ? "5 · 人工審核" : "5 · Human review",
              desc: zh
                ? "維護者審核 regex 形狀、test case 覆蓋、以及來源文件。Stable 等級需要 human-reviewed provenance。"
                : "Maintainer reviews regex shape, test case coverage, and source citation. Stable tier requires human-reviewed provenance.",
            },
            {
              gate: zh ? "6 · PR 合規性" : "6 · PR compliance",
              desc: zh
                ? "每個 PR 最多 10 條新規則。test_cases 必須包含 true_positives + true_negatives。"
                : "Maximum 10 new rules per PR. test_cases must include true_positives and true_negatives.",
            },
          ].map((item) => (
            <div key={item.gate} className="bg-paper p-5 md:p-6">
              <div className="font-data text-xs text-blue tracking-wide uppercase mb-2">{item.gate}</div>
              <p className="text-sm text-graphite leading-[1.7]">{item.desc}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Succession plan */}
      <Reveal>
        <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-3">
          {zh ? "繼承計畫" : "Succession plan"}
        </div>
        <h2 className="font-display text-xl font-extrabold tracking-[-0.5px] mb-4">
          {zh ? "如果首席維護者無法履行職責。" : "If the lead maintainer becomes unavailable."}
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="bg-paper border border-fog p-6 md:p-8 mb-12">
          <div className="space-y-4 text-sm text-graphite leading-[1.7]">
            <p>
              {zh
                ? "短期（30 天內）：GitHub 的 CODEOWNERS 檔案與 CI 自動化維護繼續運作，已合併的規則繼續透過 npm 發布。ATR 不依賴單一伺服器或閉源系統——規則是純文字 YAML，任何人都可以 fork。"
                : "Short term (within 30 days): The CODEOWNERS file and CI automation continue to function on GitHub. Merged rules continue to publish via npm. ATR has no dependency on a single server or closed system — rules are plain-text YAML and anyone can fork."}
            </p>
            <p>
              {zh
                ? "中期：第二位維護者（招募進行中）接任 PR 審核職責。如果 30 天後仍未找到，現有的貢獻者（MISP 的 adulau、OWASP 的 mertsatilmaz）將被邀請擔任臨時維護者。"
                : "Medium term: A second maintainer (recruitment ongoing) takes over PR review. If none is identified within 30 days, existing contributors — adulau (MISP) and mertsatilmaz (OWASP) — will be invited to serve as interim maintainers."}
            </p>
            <p>
              {zh
                ? "長期：ATR 路線圖包含將標準轉移至中立基金會（Linux Foundation 或 OpenSSF）的評估。轉移條件：有兩名以上外部維護者，以及至少一個組織願意提供資源支持治理。"
                : "Long term: The ATR roadmap includes evaluating transfer to a neutral foundation (Linux Foundation or OpenSSF). Transfer requires: two or more external maintainers, and at least one organization willing to fund governance overhead."}
            </p>
          </div>
        </div>
      </Reveal>

      {/* Conflict of interest */}
      <Reveal>
        <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-3">
          {zh ? "利益衝突揭露" : "Conflict-of-interest disclosure"}
        </div>
        <h2 className="font-display text-xl font-extrabold tracking-[-0.5px] mb-4">
          {zh ? "ATR 與 PanGuard AI Inc 的關係。" : "The relationship between ATR and PanGuard AI Inc."}
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="bg-paper border border-fog p-6 md:p-8 mb-12">
          <div className="space-y-4 text-sm text-graphite leading-[1.7]">
            <p>
              {zh
                ? "ATR（Agent Threat Rules）是 MIT 授權的開放標準，由 Agent-Threat-Rule GitHub 組織維護。PanGuard AI Inc 是 2026-05-12 在美國德拉瓦州成立的獨立商業公司，由 Adam Lin 創立。"
                : "ATR (Agent Threat Rules) is an MIT-licensed open standard maintained under the Agent-Threat-Rule GitHub organization. PanGuard AI Inc is a separate commercial company incorporated in Delaware, USA on 2026-05-12, founded by Adam Lin."}
            </p>
            <p>
              {zh
                ? "重疊之處：兩者的主要聯絡人是同一人（Adam Lin）。PanGuard AI 的產品將 ATR 規則作為上游依賴，與 Cisco AI Defense 和 Microsoft AGT 的做法相同。"
                : "Overlap: The primary contact is the same person (Adam Lin). PanGuard AI's product depends on ATR rules as an upstream dependency — the same relationship Cisco AI Defense and Microsoft AGT have."}
            </p>
            <p>
              {zh
                ? "界限：ATR 的規則、CHANGELOG、benchmark 資料、以及文件不得被 PanGuard AI 的商業利益所操控。ATR 的 issue tracker 和 PR review 流程對所有人開放，包括 PanGuard AI 的競爭對手。ATR 的 GOVERNANCE.md 在 GitHub 上公開查閱。"
                : "The boundary: ATR's rules, CHANGELOG, benchmark data, and documentation must not be distorted by PanGuard AI's commercial interests. ATR's issue tracker and PR review process is open to everyone, including PanGuard AI's competitors. ATR's GOVERNANCE.md is publicly auditable on GitHub."}
            </p>
            <p>
              {zh
                ? "如果你觀察到任何違反這個界限的情況，請在 GitHub 開 issue 或寄信至 contact@agentthreatrule.org。"
                : "If you observe any violation of this boundary, please open an issue on GitHub or email contact@agentthreatrule.org."}
            </p>
          </div>
        </div>
      </Reveal>

      {/* Contribution rights */}
      <Reveal>
        <div className="font-data text-xs font-medium text-stone tracking-[3px] uppercase mb-3">
          {zh ? "貢獻者權利" : "Contributor rights"}
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="bg-ash p-6 md:p-8 mb-12 text-sm text-graphite leading-[1.7]">
          <p className="mb-3">
            {zh
              ? "所有貢獻都以 MIT 授權發布。貢獻者保留以任何方式使用其攻擊研究的所有權利——ATR 只攜帶偵測，不佔有研究本身。"
              : "All contributions are published under MIT license. Contributors retain all rights to use their attack research in any form — ATR carries the detection, not ownership of the research."}
          </p>
          <p>
            {zh
              ? "貢獻者的名字出現在規則的 author 欄位和 metadata_provenance.discovered_by 欄位。當 MISP 匯出到 STIX，當 NIST 引用規則，署名隨著傳遞。"
              : "A contributor's name appears in the rule's author field and metadata_provenance.discovered_by field. When MISP exports to STIX, when NIST cites the rule, attribution travels with it."}
          </p>
        </div>
      </Reveal>

      {/* Links */}
      <Reveal>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://github.com/Agent-Threat-Rule/agent-threat-rules/blob/main/GOVERNANCE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-data text-xs text-blue hover:underline"
          >
            {zh ? "在 GitHub 查看 GOVERNANCE.md" : "View GOVERNANCE.md on GitHub"} &rarr;
          </a>
          <span className="text-fog">|</span>
          <a
            href="https://github.com/Agent-Threat-Rule/agent-threat-rules/blob/main/CONTRIBUTORS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-data text-xs text-blue hover:underline"
          >
            {zh ? "貢獻者名單" : "Contributors list"} &rarr;
          </a>
          <span className="text-fog">|</span>
          <Link href={`/${locale}/about`} className="font-data text-xs text-blue hover:underline">
            {zh ? "關於 ATR" : "About ATR"} &rarr;
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
