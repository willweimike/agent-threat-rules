ATR website architecture v2 — Day 61 post-sprint draft
Date: 2026-05-12
Owner: Adam Lin
Status: DRAFT awaiting VC panel review
Reviewers: 3 parallel agents simulating distinct VC lenses

============================================================

# Context for reviewers

ATR (Agent Threat Rules) is an MIT-licensed open detection rule corpus for AI agent attacks. Today (2026-05-12) we shipped 75 new rules in a 24-hour multi-agent sprint, bringing total from 344 to 419 production rules.

Production deployments (verified merged PRs): Microsoft Agent Governance Toolkit (4 PRs, latest AGT#1981 5/11 Microsoft Copilot SWE Agent triage), Cisco AI Defense skill-scanner (PR #79), MISP taxonomies (#323) + galaxy (#1207), OWASP Agent Security Reference Hub (#74), OWASP Agentic Top 10 precize (#14), NIST AI RMF OSCAL Path 1 catalog acceptance.

Headline benchmarks post-sprint:
- HackAPrompt 4,780 samples: 28.6% → 66.2% recall (+37.6pp), 100% precision
- garak 3,475 prompts: 28.7% → 39.0%, ATR-core families ~80%+
- PINT 850 samples: 62.5% → 63.9%, 0.25% FP maintained
- SKILL.md 341 samples: 100% precision, 0% FP
- All 4 benchmarks ran 0 FP regression

Website tech: Next.js 14 (App Router, [locale] dynamic), Tailwind, deployed Vercel, bilingual (en/zh), Vercel Analytics installed.

Current pages: /, /about, /rules, /coverage, /threats, /threats/[actor], /compliance, /compliance/nist-ai-rmf, /research, /red-team, /quality-standard, /integrate, /integrate/garak, /changelog, /ecosystem, /sovereign-ai-defense, /wall, /contribute, /partner-sync.

Existing /red-team page has 810 lines, structured as per-source entries with status (in-production / in-review / corpus), org, homepage, PR URL, hook, what_atr_did. Current entries include NVIDIA Garak, HarmBench, AgentDojo, JailbreakBench, and others.

============================================================

# Proposed architecture v2

## Page-level information architecture

| Page | Role | Day 61 update |
|------|------|---------------|
| / (homepage hero) | First impression | Stats grid: 419 rules / 7 ecosystem merges / 66.2% HackAPrompt / 97.1% garak / 0 FP / MIT |
| /red-team | Red-team source-to-rule narrative anchor | Add Day 61 Sprint Report section + 4 new source entries (HackAPrompt, Vendor test suites, PromptInject, OWASP+ATLAS) + "What we don't import" section |
| /coverage | Quantified recall × precision × FP | Before/After delta column, garak per-family breakdown |
| /research | Academic / methodology | Multi-source pipeline methodology, cluster + auto-regex 2-gate explanation |
| /quality-standard | Quality assurance | 2-gate verify details, benign corpus composition, KEPT-AS-IS rationale, FP-fix iteration examples |
| /compliance | 6-framework matrix | 75 new rules with OWASP/ATLAS/EU/NIST/ISO mapping coverage |
| /changelog | Version history | v2.2.0 entry |
| /integrate | 7 downstream production consumers | Refresh integration counts |
| /integrate/garak | garak integration detail | Update wrapped rule count 293 → 419 |
| /threats/[actor] | Attack family pages | Add new families: package hallucination, MCP web-context poisoning, rules-file backdoor, SSRF agent fetch |
| /about | Mission + founder | Add 60-day timeline section |
| /rules | Rule catalog | Auto (lists 419) |

## Five narrative anchors for Day 61

1. Scaled methodology: 11 parallel agents × 5 corpora → 75 rules in 24 hours
2. Reverse reciprocity: garak/Microsoft/Vendor test data → ATR rules, bidirectional flow
3. HackAPrompt recall +37pp: 28.6% → 66.2% on 4,780 academic adversarial samples
4. Standards-aligned executable rules: 8 rules each mapping to OWASP LLM Top 10 + MITRE ATLAS named techniques
5. Honest scope: PyRIT/Pliny refused, AdvBench/HarmBench/JBB reclassified as test corpora, 4 rules KEPT-AS-IS as corpus fingerprints

## Production state

- 419 rules: 357 stable + 62 experimental
- 6-framework compliance on all new rules
- 7 organizations merged (4 production-grade: Microsoft AGT + Cisco AI Defense + MISP tax + MISP gal + OWASP A-S-R-H + OWASP precize + NIST OSCAL Path 1)
- npm: agent-threat-rules 23K downloads/30d
- PyPI: pyatr
- GitHub Marketplace: ATR Scan Action

============================================================

# What I am asking the VC panel to evaluate

Three lenses, each delivered by a separate reviewer:

## Lens A: Security stack investor (a16z / Sequoia security thesis)
Evaluate the architecture from the perspective of "Is this defensible?" and "Does this telegraph the network of integrations that creates the moat?"

Critical questions:
- What stops Cisco from forking and dropping ATR? Is the architecture making the answer visible to a buyer?
- Where does the F500 production proof live? Is it page 1 or buried?
- Is the network effect from each new ecosystem integration visible at a glance?
- Does the architecture differentiate ATR from closed-source competitors (Lakera $50M, Straiker $20M, Noma $30M, 7AI $180M) raising hundreds of millions on similar work?

## Lens B: AI safety / standards investor (Open Phil-adjacent, Conjecture, AISI-aligned)
Evaluate from "Is this an open standard that the community will adopt?" and "How does this contribute to AI safety long-term?"

Critical questions:
- Is the comparison to Sigma / YARA / Falco clear enough to anchor the standard play?
- Is the community governance story visible? Where do contributors come in?
- Is the honesty signal strong enough? The "What we don't import" section — does it land or look defensive?
- Does the architecture support a transition to community-governed (Linux Foundation / similar) without founder bus-factor risk?

## Lens C: Enterprise B2B SaaS investor (early-stage GTM, who buys this?)
Evaluate from "Who pays for this and how?" and "What is the buyer journey on this site?"

Critical questions:
- Who is the website's primary buyer persona? CISO, security architect, AI/ML safety lead, compliance officer? Is this clear?
- Where does PanGuard AI (the commercial entity that consumes ATR rules) appear? Or is the ATR site deliberately commercial-free?
- Is there a CTA path that converts a CISO researching "AI agent detection" into a sales conversation?
- Compliance page maps 6 frameworks — does this telegraph the compliance buyer signal? Is the framing tight enough for enterprise procurement?

============================================================

# Constraints reviewers must respect

- ATR is MIT-licensed in perpetuity; commercial entity is PanGuard AI Inc (Delaware C-Corp, just incorporated 2026-05-12). These are SEPARATE codebases.
- Per the user's rule: never claim Cisco-merge as the final external bar; we hold rules to internal Cisco-merge-equivalent standard, then submit to actual Cisco AI Defense team for external review.
- Per the user's rule: no AI-flavor language ("I'm excited", "comprehensive framework", "leverage", three-item parallel bullets, em-dash-as-comma).
- Per the user's rule: only verifiable claims; cite source URLs, PR numbers, license, commit SHA.
- The website is not the place to overclaim sovereign AI customers — those are conversations in motion, not closed deals.

# What the reviewer is NOT being asked to do

- Don't implement code.
- Don't critique the underlying ATR product or rule quality.
- Don't propose marketing copy; we have a no-AI-flavor rule.
- Don't suggest adding /pricing or /buy-now pages (PanGuard side, not ATR).

# Reviewer deliverable format

Each reviewer returns:
1. Top 3 STRENGTHS of the proposed architecture from their lens
2. Top 3 WEAKNESSES or risks they would raise as an investor
3. Specific RECOMMENDATIONS — what to add, remove, or restructure
4. Any FATAL FLAWS that would make them pass on the company entirely if they saw this site
5. Overall verdict on whether this site would generate investor interest from their persona

Brief, direct, no hedging. Real VC review tone, not consultative.
