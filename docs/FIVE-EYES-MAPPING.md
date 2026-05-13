# ATR -> Five Eyes "Careful Adoption of Agentic AI Services" Mapping

- **ATR corpus version:** v2.2.0, 419 rules across 10 detection-rule categories
- **Five Eyes guidance version:** v1.0, 2026-05-01, joint publication by CISA (US) + NSA (US) + ASD-ACSC (Australia) + CCCS (Canada) + NCSC-UK + NCSC-NZ
- **Document date:** 2026-05-13
- **Maintainer:** Adam Lin (adam@agentthreatrule.org), Panguard AI Inc. (Delaware C-Corp)
- **License:** MIT

## Citation status note (read first)

Every quote of Five Eyes guidance content in this document is sourced from a CyberScoop summary at https://cyberscoop.com/cisa-nsa-five-eyes-guidance-secure-deployment-ai-agents/. The primary PDF could not be directly fetched at the time of writing (the relevant `.gov` endpoints returned 403 / timeout). Verbatim text in the final published guidance may differ from the wording reproduced here. Quotes are attributed inline as "via CyberScoop summary". Before any public announcement, this document must be re-verified against the primary PDF and quotes replaced with verbatim text where possible. See the verification TODO at the end.

## Executive summary

The Five Eyes joint guidance "Careful Adoption of Agentic AI Services" shipped on 2026-05-01 with 5 named risk categories and zero executable detection rules. The guidance explicitly notes that some risks unique to agentic systems are not yet covered by existing frameworks and calls for more research and collaboration (via CyberScoop summary).

ATR v2.2.0 ships 419 rules across 10 detection-rule categories, with 6-framework compliance metadata (OWASP Agentic Top 10 + OWASP LLM Top 10 + MITRE ATLAS + NIST AI RMF + EU AI Act + ISO/IEC 42001). This document maps each of the 5 Five Eyes categories to specific ATR rule clusters, identifies the executable artifact each category needs, and is honest about what ATR does not cover.

The mapping does not claim Five Eyes endorsement of ATR. It is provided as a community detection-rule starter set for operators implementing the guidance.

## Per-category mapping

### Category 1 — Privilege

**Category description (via CyberScoop summary):** Agents granted excessive access. "A single compromise can cause far more damage than a typical software vulnerability." Recommended controls: short-lived credentials, encrypted communications, "each agent carry a verified, cryptographically secured identity."

**Why this needs detection rules:** Identity attestation and credential rotation are architectural controls (you either have them or you do not). Runtime detection rules are still needed to catch (a) credential leakage in agent output, (b) scope-creep where an agent abuses a legitimate credential beyond its intended scope, (c) attempts to elevate to privileged tool calls without a confirmation step.

**ATR rule clusters that satisfy this:**

- `privilege-escalation/` (12 rules):
  - ATR-2026-00040 privilege-escalation — generic detection for explicit elevation requests
  - ATR-2026-00041 scope-creep — agent expanding beyond its declared scope
  - ATR-2026-00110 eval-injection — code execution via eval primitives
  - ATR-2026-00111 shell-escape — escape from sandboxed execution
  - ATR-2026-00112 dynamic-import-exploitation — runtime module loading abuse
  - ATR-2026-00204 stealth-execution-persistence — persistence without audit trace
  - ATR-2026-00436 enclave-vm-sandbox-escape-rce — concrete CVE-class sandbox escape
  - ATR-2026-00441 semantic-kernel-sessions-python-plugin-startup-persistence — MSRC CVE-2026-26030 chain
  - ATR-2026-00451 litellm-admin-sqli — CISA KEV CVE-2026-42208
- `excessive-autonomy/` (8 rules):
  - ATR-2026-00098 unauthorized-financial-action — financial tool call without confirmation
  - ATR-2026-00099 high-risk-tool-gate — defense-in-depth gate forcing `ask` verdict on financial/destructive/communication/permission/system tool categories
  - ATR-2026-00428 nl-unauthorized-shell-execution — shell command via natural language without human authorization
  - ATR-2026-00500 ssrf-via-agent-url-fetch-instruction — SSRF through agent-initiated URL fetch
- `context-exfiltration/` (subset of 40 rules covering credential leakage):
  - ATR-2026-00021 api-key-exposure — direct API key leak
  - ATR-2026-00113 credential-theft — explicit credential extraction prompt
  - ATR-2026-00114 oauth-token-abuse — OAuth token misuse
  - ATR-2026-00115 env-var-harvesting — environment variable extraction
  - ATR-2026-00150 credential-in-tool-response — credential surfaced through a tool response
  - ATR-2026-00152 obfuscated-credential-leak — credential leak with obfuscation evasion
  - ATR-2026-00201 credential-pipe-exfiltration — piping credentials to external sink
  - ATR-2026-00212 mcp-atlassian-credential-leak — MCP server credential leak

**Strength:** STRONG (29 rules across 3 clusters covering this category)

**Cross-link:** ATR detects abuse of credentials at runtime. ATR does not issue or attest cryptographic agent identity. That layer belongs to identity infrastructure (W3C DIDs, agent-attestation frameworks, Lyrie ATP). ATR is the runtime detection layer that complements identity layer.

### Category 2 — Design and Configuration Flaws

**Category description (via CyberScoop summary):** Poor setup. The guidance recommends "zero trust, defense-in-depth, least-privilege" architectures.

**Why this needs detection rules:** Architecture audit (zero-trust posture) is a one-time review and recurring policy enforcement task. Runtime detection rules are needed to catch when concrete configuration flaws ship in production code paths — input-handling shortcuts, missing validation, weak isolation between agent components, expressions that evaluate untrusted strings, cross-tool boundary violations.

**ATR rule clusters that satisfy this:**

- `tool-poisoning/` (27 rules):
  - ATR-2026-00010 mcp-malicious-response — malicious payload returned by MCP server
  - ATR-2026-00013 tool-ssrf — SSRF through tool parameter
  - ATR-2026-00106 schema-description-contradiction — tool schema lies about behavior
  - ATR-2026-00161 important-tag-cross-tool-shadowing — IMPORTANT-tag injection across tool boundary
  - ATR-2026-00270 xss-in-tool-response — XSS payload in tool output
  - ATR-2026-00277 echo-template-command-injection — command injection via templated tool echo
  - ATR-2026-00415 flowise-custom-mcp-stdio-rce — concrete Flowise RCE
  - ATR-2026-00419 cursor-mcp-zero-click-config — Cursor zero-click MCP config attack
- `model-security/` (3 rules):
  - ATR-2026-00072 model-behavior-extraction — extraction of internal model behavior
  - ATR-2026-00073 malicious-finetuning-data — fine-tuning data poisoning
  - ATR-2026-00433 modelcache-torch-load-deserialization-rce — concrete torch deserialization RCE
- Tool input/output validation rules in `prompt-injection/` (covering input-validation gaps in agent boundaries):
  - ATR-2026-00084 structured-data-injection — injection through structured input fields
  - ATR-2026-00083 indirect-tool-injection — injection from a tool boundary

**Strength:** MODERATE (32 rules concentrated on input/output handling; broader architectural concerns remain out of scope)

**Cross-link:** Concrete CVE-class flaws (Spring AI Milvus filter-expression injection CVE-2026-41705, Semantic Kernel In-Memory Vector Store eval-RCE CVE-2026-26030) ship as ATR rules within hours of disclosure. Architectural anti-patterns (missing zero-trust boundary, no isolation between agent components) are out of pattern-detection scope and require architectural review.

### Category 3 — Behavioral Risks

**Category description (via CyberScoop summary):** Agents pursuing goals in unintended ways. The guidance recommends: "for high-impact actions, a human should have to sign off." The guidance also notes that organizations should "assume that agentic AI systems may behave unexpectedly and plan deployments accordingly." Prompt injection is "addressed as lingering risk but no specific technical controls detailed" (via CyberScoop summary).

**Why this needs detection rules:** This is the category most directly addressable by runtime detection. Prompt injection, jailbreak attempts, multi-turn manipulation, indirect injection through retrieved content — these are exactly what regex-and-LLM-hybrid detection rule corpora are built for. The Five Eyes guidance acknowledges the gap; ATR fills it.

**ATR rule clusters that satisfy this:**

- `prompt-injection/` (172 rules) — the densest cluster in the corpus:
  - ATR-2026-00001 direct-prompt-injection — canonical direct injection
  - ATR-2026-00002 indirect-prompt-injection — payload from retrieved context
  - ATR-2026-00003 jailbreak-attempt — classic jailbreak family
  - ATR-2026-00004 system-prompt-override — attempt to override system prompt
  - ATR-2026-00005 multi-turn-injection — multi-turn manipulation
  - ATR-2026-00080 encoding-evasion — base64/rot13/hex evasion
  - ATR-2026-00081 semantic-multi-turn — semantic-shift multi-turn
  - ATR-2026-00091 nested-payload — nested payload obfuscation
- `agent-manipulation/` (105 rules) — manipulation across agent boundaries:
  - ATR-2026-00030 cross-agent-attack — payload crossing agent boundary
  - ATR-2026-00032 goal-hijacking — adversarial goal substitution
  - ATR-2026-00076 inter-agent-message-spoofing — spoofed inter-agent message
  - ATR-2026-00117 agent-identity-spoofing — agent identity claim spoofing
  - ATR-2026-00118 approval-fatigue — repeated low-stakes asks to fatigue the operator
  - ATR-2026-00119 social-engineering-via-agent — agent used to social-engineer human
  - ATR-2026-00271 grandma-roleplay-jailbreak — canonical roleplay jailbreak
  - ATR-2026-00273 dan-developer-mode-persona — DAN / developer-mode persona family
  - ATR-2026-00301 tap-tree-of-attacks-jailbreak — TAP automated jailbreak family
- `model-abuse/` (10 rules):
  - ATR-2026-00279 harmful-completion-continuation — continuation-based harm elicitation
  - ATR-2026-00284 glitch-token-destabilization — glitch-token destabilization
  - ATR-2026-00299 harmbench-detailed-harmful-instruction — HarmBench class

**Strength:** STRONG (287 rules across 3 clusters; this is the highest-density area of the ATR corpus)

**Cross-link:** ATR can flag the high-impact action via `response.actions: require_auth_challenge`, but the actual human-approval UX is operator-side. The detection layer raises the signal; the operator-side approval gate must be implemented separately. Honest limit: paraphrase bypasses of canonical injection payloads are not always caught — regex-and-pattern detection is one defense layer, not the only one.

### Category 4 — Structural Risk

**Category description (via CyberScoop summary):** Interconnected agent networks causing cascading failures. The guidance recommends "prioritising resilience, reversibility and risk containment over efficiency gains" (via CyberScoop summary).

**Why this needs detection rules:** Resilience and reversibility are architectural properties. But cascading-failure precursors are observable at runtime: runaway loops, resource exhaustion, cross-user data leak through shared memory, structured-data injection that propagates across agent boundaries. Detection rules catch these precursors before the cascade.

**ATR rule clusters that satisfy this:**

- `excessive-autonomy/` (subset):
  - ATR-2026-00050 runaway-agent-loop — agent invocation loop without exit condition
  - ATR-2026-00051 resource-exhaustion — agent exhausting downstream resources
  - ATR-2026-00052 cascading-failure — propagating failure across agent network
- `context-exfiltration/` (subset for cross-boundary leaks):
  - ATR-2026-00075 agent-memory-manipulation — memory poisoning across sessions
  - ATR-2026-00102 disguised-analytics-exfiltration — exfil disguised as analytics
  - ATR-2026-00136 tool-response-data-piggyback — data piggybacked through tool response
  - ATR-2026-00261 markdown-image-exfiltration — markdown image URL exfil
- `data-poisoning/` (2 rules):
  - ATR-2026-00070 data-poisoning — training/retrieval data poisoning
  - ATR-2026-00450 spring-ai-prompt-memory-poisoning — Spring AI ChatMemory cross-user leak (CVE-2026-41713)
- `agent-manipulation/` (subset for cross-agent propagation):
  - ATR-2026-00074 cross-agent-privilege-escalation — privilege propagating across agent boundary
  - ATR-2026-00108 consensus-sybil-attack — sybil attack on multi-agent consensus
  - ATR-2026-00116 a2a-message-validation — agent-to-agent message validation failure

**Strength:** MODERATE (12 directly-relevant rules; "resilience" itself is architectural and out of scope)

**Cross-link:** ATR detects precursors of structural failure. ATR cannot guarantee reversibility or roll-back; that is the runtime platform's responsibility. The detection signal feeds the runtime's containment decision.

### Category 5 — Accountability

**Category description (via CyberScoop summary):** Difficult-to-inspect decision processes. Consequences include "altered files, changed access controls and deleted audit trails" (via CyberScoop summary).

**Why this needs detection rules:** Accountability is primarily an audit-evidence and logging concern. Detection rules contribute the structured event taxonomy (so an audit log entry has a stable rule ID, severity, category, response action) and the audit-evasion detection layer (rules that catch attempts to delete or rewrite the audit trail).

**ATR rule clusters that satisfy this:**

- `skill-compromise/` (41 rules — skill-manifest and skill-update integrity):
  - ATR-2026-00060 skill-impersonation — skill impersonating another skill
  - ATR-2026-00061 description-behavior-mismatch — skill description lies about behavior
  - ATR-2026-00062 hidden-capability — skill hides capability from manifest
  - ATR-2026-00065 skill-update-attack — malicious update to previously trusted skill
  - ATR-2026-00120 skill-instruction-injection — instruction-layer injection in skill
  - ATR-2026-00126 skill-rug-pull-setup — rug-pull pattern setup in skill
  - ATR-2026-00128 html-comment-hidden-payload — hidden payload in HTML comment
  - ATR-2026-00129 unicode-smuggling — unicode smuggling in skill
  - ATR-2026-00135 exfil-url-in-instructions — exfil URL embedded in instructions
- Audit-evasion rules across categories:
  - ATR-2026-00085 audit-evasion — canonical audit-evasion family (prompt-injection)
  - ATR-2026-00094 audit-bypass — audit-bypass attempt (prompt-injection)
  - ATR-2026-00105 silent-action-concealment — silent action concealment (tool-poisoning)
- Cross-cutting taxonomy contribution: every ATR rule emits a stable `id`, `severity`, `category`, and `response.actions` — these are the audit-log primitives.

**Strength:** LIMITED (audit-evasion and skill-integrity are covered; the audit infrastructure itself — log retention, tamper-resistance, attribution — is operator-side)

**Cross-link:** ATR contributes the structured-event taxonomy and audit-evasion detection. The audit log retention, tamper-resistance, and human-readable evidence binding belong to OSCAL-AI-RMF (see the ai-rmf-oscal-catalog repo) and to the operator's logging stack.

## What ATR does NOT cover (be honest)

- **"Verified, cryptographically secured identity" for each agent (Privilege).** ATR is detection-side, not identity-side. Identity attestation belongs to W3C DID infrastructure, agent-attestation frameworks, or Lyrie ATP. ATR complements identity at the runtime detection layer.
- **Approval-workflow UX for high-impact actions (Behavioral).** ATR can flag a high-impact tool call (`response.actions` includes `require_auth_challenge`), but the actual operator-side approval step is implementation-defined. ATR raises the signal; the operator builds the gate.
- **Resilience, reversibility, risk containment (Structural).** These are architectural and platform-level properties. ATR detects cascading-failure precursors but cannot guarantee reversibility. The runtime must implement roll-back.
- **Audit-log retention, tamper-resistance, attribution (Accountability).** ATR contributes the structured event taxonomy and audit-evasion detection. The audit infrastructure itself — append-only storage, signed log entries, retention policy — is operator-side.
- **Paraphrase bypass of canonical attack payloads.** Regex-and-pattern detection does not catch every adversarial paraphrase. ATR is one defense layer, not the only layer.
- **Multilingual coverage.** Rules are predominantly English-language today. Japanese and German extension are in progress.
- **Novel attack families with no published precedent.** ATR responds fast to disclosed precedents (the Microsoft Semantic Kernel response was 2 hours 16 minutes from MSRC disclosure to npm-published rules on 2026-05-11) but does not predict zero-day classes.

## How to consume this mapping

- This document is the markdown source. Auto-generated JSON at `docs/five-eyes-mapping.json` is pending (mapping script not yet written; tracked in the verification TODO).
- Operators implementing Five Eyes guidance can use this as their detection-rule starter set: install ATR (`npm install @panguard-ai/agent-threat-rules` or git-clone the repo), enable the rule categories listed under each Five Eyes category, and integrate the detection signal into the existing security telemetry pipeline.
- Auditors verifying a deployment can verify the runtime loads ATR rules covering all 5 Five Eyes categories by checking which rule IDs the runtime evaluates against agent input/output.
- The 6-framework compliance metadata on each rule (OWASP Agentic Top 10 + OWASP LLM Top 10 + MITRE ATLAS + NIST AI RMF + EU AI Act + ISO/IEC 42001) allows auditors to satisfy multiple framework obligations from a single detection-rule installation.

## Open collaboration

- ATR is MIT-licensed and at https://github.com/Agent-Threat-Rule/agent-threat-rules.
- Contributions accepted via PR. Quality gate is a 6-check enforcement (schema validation, own-TP-must-match, benign-corpus FP, research-mention FP, cross-rule conflict, per-PR cap).
- Operational record: 13 external PR merges across 6 external organizations (Microsoft, Cisco, MISP/CIRCL, OWASP A-S-R-H third-party precize repo, plus 2 others in NIST OSCAL Path 1 acceptance and ecosystem awesome-lists). OWASP A-S-R-H is the third-party precize repo, not the OWASP Foundation repo.
- Maintainer contact: Adam Lin (adam@agentthreatrule.org), Taiwan.

## References

- Five Eyes joint guidance, "Careful Adoption of Agentic AI Services," 2026-05-01.
  - Primary PDF (DoD media library, posted 2026-04-30): https://media.defense.gov/2026/Apr/30/2003922823/-1/-1/0/CAREFUL%20ADOPTION%20OF%20AGENTIC%20AI%20SERVICES_FINAL.PDF
  - CISA resource page: https://www.cisa.gov/resources-tools/resources/careful-adoption-agentic-ai-services
  - NSA press release: https://www.nsa.gov/Press-Room/Press-Releases-Statements/Press-Release-View/Article/4475134/
- CyberScoop summary (secondary source used throughout this mapping): https://cyberscoop.com/cisa-nsa-five-eyes-guidance-secure-deployment-ai-agents/
- ATR rule corpus: https://github.com/Agent-Threat-Rule/agent-threat-rules
- 6-framework compliance scope: OWASP Agentic Top 10 + OWASP LLM Top 10 + MITRE ATLAS + NIST AI RMF + EU AI Act + ISO/IEC 42001
- OSCAL AI RMF catalogue (CC0): https://github.com/Agent-Threat-Rule/ai-rmf-oscal-catalog

## Verification TODO (before any public announcement)

- [ ] Fetch primary PDF via authenticated browser session (Chrome MCP, curl with realistic user-agent, or direct CISA contact)
- [ ] Replace CyberScoop paraphrase quotes with verbatim text from the primary PDF where possible
- [ ] Confirm the exact 5-category section headings match the primary PDF (the names "Privilege / Design and Configuration Flaws / Behavioral Risks / Structural Risk / Accountability" used here are CyberScoop's wording, not necessarily verbatim)
- [ ] Confirm no additional recommendations were missed in this mapping (e.g. specific sub-recommendations within each category that ATR could also map to)
- [ ] Generate auto-`docs/five-eyes-mapping.json` from this markdown (mapping script pending)
- [ ] Re-validate rule-ID list (ATR rules ship weekly; the rule IDs cited here are pinned to v2.2.0 / 419 rules / 2026-05-13)
- [ ] Have a second reviewer sanity-check the strength rating (STRONG / MODERATE / LIMITED) per category
