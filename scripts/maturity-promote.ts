#!/usr/bin/env npx tsx
/**
 * maturity-promote.ts
 *
 * Auto-promotes rules along the maturity ladder defined in
 * docs/QUALITY-GATE.md:
 *
 *   experimental  -- (≥30 days in main + 0 FP reports)  -->  test
 *   test          -- (≥60 days in main + 0 FP reports + ≥1 wild match)  -->  stable
 *
 * Promotion is gated by git history (when did the file land?) and by
 * the GitHub issue tracker (any open issues labelled `false-positive`
 * referencing this rule id?). Wild-match evidence is the weakest part
 * — for now we accept "rule has ≥3 test_cases.true_positives, and at
 * least one TP looks like a copy from a real advisory (length ≥40
 * chars, contains a special char or quote)". When telemetry lands
 * (docs/telemetry-spec.md), the wild-match check switches to real
 * downstream signal.
 *
 * Usage:
 *   npx tsx scripts/maturity-promote.ts                    # dry-run
 *   npx tsx scripts/maturity-promote.ts --write            # write
 *   npx tsx scripts/maturity-promote.ts --rule ATR-2026-... # one rule
 *   npx tsx scripts/maturity-promote.ts --since YYYY-MM-DD  # different cutoff
 *
 * Exit codes:
 *   0  success (n rules would be / were promoted)
 *   1  fatal error
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import yaml from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..");
const RULES_DIR = resolve(REPO_ROOT, "rules");
const DATA_OUT = resolve(REPO_ROOT, "data/maturity-promote");

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(n);
const opt = (n: string): string | undefined => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

const WRITE = flag("--write");
const RULE_FILTER = opt("--rule");
const TODAY = opt("--since") ?? new Date().toISOString().slice(0, 10);
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const REPO =
  process.env.GITHUB_REPOSITORY ?? "Agent-Threat-Rule/agent-threat-rules";

const EXPERIMENTAL_TO_TEST_DAYS = 30;
const TEST_TO_STABLE_DAYS = 60;

interface RuleDoc {
  id?: string;
  maturity?: string;
  test_cases?: {
    true_positives?: Array<string | { input?: string }>;
  };
  author?: string;
}

interface PromotionCandidate {
  file: string;
  ruleId: string;
  currentMaturity: string;
  proposedMaturity: string;
  daysInCurrentTier: number;
  reason: string;
}

function walkYamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const f = join(dir, entry);
    let s;
    try {
      s = statSync(f);
    } catch {
      continue;
    }
    if (s.isDirectory()) out.push(...walkYamlFiles(f));
    else if (s.isFile() && (entry.endsWith(".yaml") || entry.endsWith(".yml")))
      out.push(f);
  }
  return out;
}

/**
 * Find the commit that set the rule's maturity to its current value.
 * Returns the commit date in YYYY-MM-DD form, or null if we can't
 * determine it (rare — only happens if the rule was just added and
 * never had a maturity edit).
 */
function lastMaturityChangeDate(
  file: string,
  currentMaturity: string,
): string | null {
  const rel = file.startsWith(REPO_ROOT + "/")
    ? file.slice(REPO_ROOT.length + 1)
    : file;
  try {
    const out = execFileSync(
      "git",
      ["log", "--reverse", "--format=%H %ai", "--", rel],
      { cwd: REPO_ROOT, encoding: "utf-8" },
    ).trim();
    if (!out) return null;
    const lines = out.split("\n");
    // Walk commits oldest → newest, find first commit where the file
    // had this maturity value. That's when this tier began.
    for (const line of lines) {
      const [sha, ...rest] = line.split(" ");
      const date = rest.join(" ").slice(0, 10);
      let content: string;
      try {
        content = execFileSync("git", ["show", `${sha}:${rel}`], {
          cwd: REPO_ROOT,
          encoding: "utf-8",
          stdio: ["ignore", "pipe", "ignore"],
        });
      } catch {
        continue;
      }
      const m = content.match(/^maturity:\s*["']?([a-z]+)["']?\s*$/m);
      if (m && m[1] === currentMaturity) return date;
    }
    // No commit had this maturity — should not happen if currentMaturity
    // came from a parsed YAML doc. Fall back to first commit date.
    const firstLine = lines[0];
    return firstLine
      ? firstLine.split(" ").slice(1).join(" ").slice(0, 10)
      : null;
  } catch {
    return null;
  }
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO).getTime();
  const b = new Date(toISO).getTime();
  return Math.floor((b - a) / 86400000);
}

async function fetchOpenFPReports(): Promise<Set<string>> {
  // Returns a set of rule IDs that appear in any open issue labelled
  // `false-positive`. Used to block promotion. Empty set if we can't
  // reach the API.
  const out = new Set<string>();
  if (!TOKEN) {
    console.error(
      "[maturity-promote] no GITHUB_TOKEN — skipping FP-report check (treating all rules as 0-FP-reports)",
    );
    return out;
  }
  const u = new URL(`https://api.github.com/repos/${REPO}/issues`);
  u.searchParams.set("state", "open");
  u.searchParams.set("labels", "false-positive");
  u.searchParams.set("per_page", "100");
  try {
    const resp = await fetch(u.toString(), {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${TOKEN}`,
        "User-Agent": "atr-maturity-promote",
      },
    });
    if (!resp.ok) {
      console.error(
        `[maturity-promote] FP-issue fetch failed: ${resp.status} ${resp.statusText}`,
      );
      return out;
    }
    const issues = (await resp.json()) as Array<{
      title: string;
      body?: string | null;
    }>;
    for (const iss of issues) {
      const text = `${iss.title}\n${iss.body ?? ""}`;
      for (const m of text.matchAll(/ATR-\d{4}-\d{5}/g)) out.add(m[0]);
    }
  } catch (e) {
    console.error(`[maturity-promote] FP-issue fetch error: ${e}`);
  }
  return out;
}

function looksLikeWildMatch(tp: string): boolean {
  // Heuristic for "this TP looks like real-world copy", not a
  // synthetic example. Adjust if telemetry replaces this.
  if (tp.length < 40) return false;
  const hasSpecial = /["'`\\<>{}\[\]|]/.test(tp);
  const hasQuoting = /["']/.test(tp);
  return hasSpecial || hasQuoting;
}

function evaluateRule(
  file: string,
  doc: RuleDoc,
  fpReports: Set<string>,
): PromotionCandidate | null {
  const ruleId = doc.id;
  const maturity = doc.maturity;
  if (!ruleId || !maturity) return null;
  if (RULE_FILTER && ruleId !== RULE_FILTER) return null;
  if (maturity !== "experimental" && maturity !== "test") return null;
  if (fpReports.has(ruleId)) {
    return {
      file,
      ruleId,
      currentMaturity: maturity,
      proposedMaturity: maturity,
      daysInCurrentTier: -1,
      reason: "blocked: open false-positive report exists",
    };
  }

  const lastChange = lastMaturityChangeDate(file, maturity);
  if (!lastChange) return null;
  const days = daysBetween(lastChange, TODAY);

  if (maturity === "experimental" && days >= EXPERIMENTAL_TO_TEST_DAYS) {
    return {
      file,
      ruleId,
      currentMaturity: "experimental",
      proposedMaturity: "test",
      daysInCurrentTier: days,
      reason: `≥${EXPERIMENTAL_TO_TEST_DAYS} days in experimental (${days}d) + 0 open FP reports`,
    };
  }
  if (maturity === "test" && days >= TEST_TO_STABLE_DAYS) {
    const tps = (doc.test_cases?.true_positives ?? []).map((t) =>
      typeof t === "string" ? t : (t?.input ?? ""),
    );
    const wildLooking = tps.filter(looksLikeWildMatch).length;
    if (wildLooking < 1) {
      return {
        file,
        ruleId,
        currentMaturity: "test",
        proposedMaturity: "test",
        daysInCurrentTier: days,
        reason: `blocked: ≥${TEST_TO_STABLE_DAYS} days in test (${days}d) but no wild-looking true_positive (≥1 required for stable)`,
      };
    }
    return {
      file,
      ruleId,
      currentMaturity: "test",
      proposedMaturity: "stable",
      daysInCurrentTier: days,
      reason: `≥${TEST_TO_STABLE_DAYS} days in test (${days}d) + 0 FP reports + ${wildLooking} wild-looking TP(s)`,
    };
  }
  return null;
}

function bumpMaturityInFile(file: string, from: string, to: string): boolean {
  const raw = readFileSync(file, "utf-8");
  const re = new RegExp(`^maturity:\\s*["']?${from}["']?\\s*$`, "m");
  if (!re.test(raw)) return false;
  const next = raw.replace(re, `maturity: ${to}`);
  writeFileSync(file, next, "utf-8");
  return true;
}

async function main(): Promise<void> {
  if (!existsSync(DATA_OUT)) mkdirSync(DATA_OUT, { recursive: true });

  const fpReports = await fetchOpenFPReports();
  if (fpReports.size > 0) {
    console.error(
      `[maturity-promote] ${fpReports.size} rule(s) blocked by open FP reports: ${[...fpReports].slice(0, 5).join(", ")}${fpReports.size > 5 ? ", ..." : ""}`,
    );
  }

  const promotions: PromotionCandidate[] = [];
  const blocked: PromotionCandidate[] = [];

  for (const file of walkYamlFiles(RULES_DIR)) {
    let doc: RuleDoc;
    try {
      doc = yaml.load(readFileSync(file, "utf-8")) as RuleDoc;
    } catch {
      continue;
    }
    const candidate = evaluateRule(file, doc, fpReports);
    if (!candidate) continue;
    if (candidate.proposedMaturity === candidate.currentMaturity) {
      blocked.push(candidate);
    } else {
      promotions.push(candidate);
    }
  }

  console.log(
    `[maturity-promote] today=${TODAY}, ${promotions.length} eligible promotion(s), ${blocked.length} blocked`,
  );

  for (const p of promotions) {
    console.log(
      `  ↑ ${p.ruleId} (${p.file.replace(REPO_ROOT + "/", "")}) — ${p.currentMaturity} → ${p.proposedMaturity}  (${p.reason})`,
    );
    if (WRITE) {
      const ok = bumpMaturityInFile(
        p.file,
        p.currentMaturity,
        p.proposedMaturity,
      );
      if (!ok) {
        console.error(`    failed to rewrite maturity line in ${p.file}`);
      }
    }
  }
  for (const b of blocked) {
    console.log(`  · ${b.ruleId} blocked — ${b.reason}`);
  }

  const report = {
    run_date: TODAY,
    mode: WRITE ? "write" : "dry-run",
    promotions: promotions.map((p) => ({
      ruleId: p.ruleId,
      file: p.file.replace(REPO_ROOT + "/", ""),
      from: p.currentMaturity,
      to: p.proposedMaturity,
      daysInCurrentTier: p.daysInCurrentTier,
      reason: p.reason,
    })),
    blocked: blocked.map((b) => ({
      ruleId: b.ruleId,
      reason: b.reason,
    })),
    fp_reports_open: [...fpReports],
  };
  writeFileSync(
    join(DATA_OUT, "last-run.json"),
    JSON.stringify(report, null, 2),
    "utf-8",
  );

  console.log(
    `\n::maturity-summary::${JSON.stringify({
      promoted: promotions.length,
      blocked: blocked.length,
      fp_reports_open: fpReports.size,
    })}`,
  );
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
