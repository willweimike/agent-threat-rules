#!/usr/bin/env tsx
/**
 * Reads stats.json and rewrites every user-facing surface that depends on it.
 * Runs in CI on every rules-merge release, and locally via `npm run sync:stats`.
 *
 * Fails loud (non-zero exit) if any derived file cannot be updated, so CI
 * blocks the release rather than shipping inconsistent numbers.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

interface Stats {
  version: string;
  lastUpdated: string;
  ruleCount: { total: number; stable: number; experimental: number; draft: number };
  spec: { version: string; status: string; doi: string };
  benchmarks: {
    garak: { recall: number; samples: number };
    skill: { recall: number; precision: number; samples: number };
    pint: { recall: number; precision: number; samples: number };
    hackaprompt: { recall: number; baselineRecall: number; samples: number };
    benign: { fpRate: number; samples: number };
  };
  ecosystem: { skillsScanned: number; confirmedMalware: number };
  distribution: { npm: { downloads30d: number }; githubStars: number };
  coverage: {
    owaspAgentic: { display: string };
    safeMcp: { display: string; percentage: number };
  };
  adoption: {
    externalOrgsMerged: number;
    externalPRMergesTotal: number;
    tier1Institutions: number;
  };
  license: string;
}

function loadStats(): Stats {
  const raw = readFileSync(join(REPO_ROOT, 'stats.json'), 'utf8');
  return JSON.parse(raw) as Stats;
}

interface SyncResult { file: string; changed: boolean; ops: string[]; }

function syncFile(rel: string, transform: (text: string) => string): SyncResult {
  const path = join(REPO_ROOT, rel);
  if (!existsSync(path)) return { file: rel, changed: false, ops: ['skip: not found'] };
  const before = readFileSync(path, 'utf8');
  const after = transform(before);
  const changed = before !== after;
  if (changed) writeFileSync(path, after);
  return { file: rel, changed, ops: changed ? ['written'] : ['unchanged'] };
}

function replaceBadge(text: string, name: string, value: string): string {
  const re = new RegExp(`(\\[!\\[${escapeReg(name)}\\]\\(https:\\/\\/img\\.shields\\.io\\/badge\\/)[^)]+(\\))`);
  return text.replace(re, (_m, p1, p2) => `${p1}${name.replace(/ /g, '_')}-${value}${p2}`);
}

function escapeReg(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function syncReadme(s: Stats): SyncResult {
  return syncFile('README.md', (text) => {
    let out = text;
    out = out.replace(
      /(\[!\[Rules\]\(https:\/\/img\.shields\.io\/badge\/rules-)\d+(-blue)/,
      `$1${s.ruleCount.total}$2`,
    );
    out = out.replace(
      /(\[!\[Garak Recall\]\(https:\/\/img\.shields\.io\/badge\/garak_recall-)[\d.]+%25(-brightgreen)/,
      `$1${s.benchmarks.garak.recall}%25$2`,
    );
    out = out.replace(
      /(\[!\[SKILL\.md Recall\]\(https:\/\/img\.shields\.io\/badge\/SKILL\.md_recall-)[\d.]+%25(-brightgreen)/,
      `$1${s.benchmarks.skill.recall}%25$2`,
    );
    out = out.replace(
      /(\[!\[Wild Scan\]\(https:\/\/img\.shields\.io\/badge\/wild_scan-)[\d,]+_skills(-blue)/,
      `$1${s.ecosystem.skillsScanned.toLocaleString('en-US').replace(/,/g, '%2C')}_skills$2`,
    );
    out = out.replace(
      /(\[!\[npm\]\(https:\/\/img\.shields\.io\/npm\/v\/agent-threat-rules[^\)]*\)\]\([^)]+\))/,
      `$1`,
    );
    return out;
  });
}

function syncCitation(s: Stats): SyncResult {
  return syncFile('CITATION.cff', (text) => {
    let out = text;
    out = out.replace(/^version: ".*"$/m, `version: "${s.version}"`);
    out = out.replace(/^date-released: ".*"$/m, `date-released: "${s.lastUpdated}"`);
    out = out.replace(/\b\d{2,4} rules across \d+ threat\b/, `${s.ruleCount.total} rules across 10 threat`);
    out = out.replace(/\(\d+\.\d+% recall on the\b/, `(${s.benchmarks.garak.recall}% recall on the`);
    out = out.replace(/garak in-the-wild jailbreak benchmark, \d+ prompts\)/, `garak in-the-wild jailbreak benchmark, ${s.benchmarks.garak.samples} prompts)`);
    out = out.replace(/on a \d+-sample benign corpus/, `on a ${s.benchmarks.benign.samples}-sample benign corpus`);
    return out;
  });
}

function syncPackageJson(s: Stats): SyncResult {
  return syncFile('package.json', (text) => {
    let out = text;
    out = out.replace(/"description": "[^"]*"/, (m) => {
      const newDesc = `Open detection standard -- like Sigma, but for AI agents. ${s.ruleCount.total} rules for prompt injection, tool poisoning, context exfiltration, and MCP attacks. Shipped in Cisco AI Defense. ${s.benchmarks.garak.recall}% recall on NVIDIA garak.`;
      return `"description": ${JSON.stringify(newDesc)}`;
    });
    return out;
  });
}

function syncQuickStart(s: Stats): SyncResult {
  return syncFile('docs/quick-start.md', (text) => {
    return text.replace(/Rules loaded: \d+/, `Rules loaded: ${s.ruleCount.total}`);
  });
}

const main = (): void => {
  const stats = loadStats();
  const results: SyncResult[] = [
    syncReadme(stats),
    syncCitation(stats),
    syncPackageJson(stats),
    syncQuickStart(stats),
  ];
  const filesystemRuleCount = countRuleFiles();
  if (filesystemRuleCount !== stats.ruleCount.total) {
    console.error(
      `[sync-stats] FATAL: stats.json says ${stats.ruleCount.total} rules; filesystem has ${filesystemRuleCount} *.yaml files in rules/.`,
    );
    process.exit(2);
  }
  const failed = results.filter((r) => r.ops.includes('skip: not found') && !r.file.startsWith('docs/'));
  if (failed.length > 0) {
    console.error('[sync-stats] FATAL: required surfaces missing:', failed.map((r) => r.file));
    process.exit(3);
  }
  for (const r of results) console.log(`[sync-stats] ${r.changed ? 'updated' : 'noop'}  ${r.file}`);
  console.log(`[sync-stats] OK · version=${stats.version} · rules=${stats.ruleCount.total}`);
};

function countRuleFiles(): number {
  const out = execSync('find rules -name "*.yaml" -type f -exec grep -l "^id: ATR-" {} \\; | wc -l', { cwd: REPO_ROOT })
    .toString()
    .trim();
  return Number.parseInt(out, 10);
}

main();
