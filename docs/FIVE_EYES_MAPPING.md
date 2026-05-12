# Five Eyes "Careful Adoption of Agentic AI Services" — ATR detection-rule mapping

Reference document for Canada CCCS, Australia ASD ACSC, UK NCSC, NZ NCSC, and US CISA + NSA staff reviewing how the Agent Threat Rules (ATR) open detection corpus maps onto the 2026-04-30 Five Eyes joint guidance "Careful Adoption of Agentic AI Services" (https://media.defense.gov/2026/Apr/30/2003922823/-1/-1/0/CAREFUL%20ADOPTION%20OF%20AGENTIC%20AI%20SERVICES_FINAL.PDF).

Authored 2026-05-12. License: MIT. Updated as new rules ship.

## Why this document exists

The Five Eyes guidance enumerates five risk categories that agentic AI services introduce. It does not name specific detection signatures, because no agreed open signature layer exists in the regulatory landscape today. ATR ships an MIT-licensed signature layer that already operates in production at Microsoft AGT, Cisco AI Defense (314 rules), MISP/CIRCL Luxembourg, and OWASP Agent-Security-Regression-Harness — and the rule categories happen to align cleanly with the Five Eyes 5-category schema.

This mapping is provided as community input. It does not claim Five Eyes endorsement of ATR. Mapping accuracy is the maintainer's responsibility.

## The 5x9 mapping table

Five Eyes guidance lists 5 risk categories. ATR ships 9 detection-rule categories. The mapping is not 1:1 because the two taxonomies were authored independently with different goals (Five Eyes is policy-shaped; ATR is engineering-shaped). Where a Five Eyes category aligns with multiple ATR categories, all are listed.

| Five Eyes category | ATR category | ATR rule examples | Coverage notes |
|---|---|---|---|
| **1. Privilege risks** — agents acting beyond intended scope, escalating permissions, or being granted excessive access | `privilege-escalation` + `excessive-autonomy` | ATR-2026-00451 LiteLLM admin SQLi (CISA KEV CVE-2026-42208), ATR-2026-00441 Semantic Kernel SessionsPythonPlugin startup persistence, agentic action-abuse families | Strong content-layer coverage for documented escalation primitives; configuration-layer escalation (overscoped IAM, missing OAuth scope checks) is out of ATR's pattern-detection scope and requires architectural review |
| **2. Design / configuration risks** — insecure defaults, missing input validation, weak isolation between agent components | `tool-poisoning` + `model-security` | ATR-2026-00448 Spring AI Milvus filter-expression injection (CVE-2026-41705), ATR-2026-00161 cross-tool shadowing, ATR-2026-00440 Semantic Kernel In-Memory Vector Store eval-RCE (CVE-2026-26030) | Strong coverage for input-handling pattern flaws; weak isolation between components (e.g. sandbox-escape via host-OS calls) requires runtime monitoring and is partial ATR coverage |
| **3. Behavioural risks** — prompt injection, model manipulation, undesired action chains, jailbreak | `prompt-injection` + `agent-manipulation` + `model-abuse` | ATR-2026-00161-00163 indirect prompt injection family (cross-tool shadowing, IMPORTANT-tag, hidden override), DAN family, AntiDAN, AutoDAN, ATR-2026-00450 Spring AI memory-poisoning (CVE-2026-41713) | Highest-density ATR coverage; this is where the 344+ rule corpus is most mature; honest about regex limits — paraphrase bypasses are not caught |
| **4. Structural risks** — data flow patterns that expose information across boundaries (memory, context, multi-user) | `context-exfiltration` + `data-poisoning` | ATR-2026-00449 Spring AI ChatMemory cross-user leak (CVE-2026-41712), markdown image URL exfil, partial API key completion, memory-poisoning-advisor patterns | Strong content-layer coverage for canonical exfil patterns; structural-attack-by-design (e.g. agent given access to user A's data while serving user B by architecture) requires authz review beyond detection |
| **5. Accountability risks** — inability to audit, attribute, or roll back agent actions | `skill-compromise` + cross-cutting | Skill-manifest scanning rules, MCP server skill audit rules, OSCAL AI RMF catalogue cross-mapping for audit-evidence binding | Partial coverage; accountability is primarily a logging / OSCAL evidence layer, where ATR contributes the structured event taxonomy rather than the audit infrastructure |

## What this mapping is not

This is a mapping between two independently-authored taxonomies. It does not claim:
- That ATR is sufficient to satisfy any Five Eyes recommendation
- That Five Eyes member agencies endorse ATR
- That the corpus covers all attack classes named in the guidance

What it does claim, with operational evidence:
- ATR ships 0 false positives on a 1,941-sample benign + research-mention corpus (the corpus deliberately includes arxiv abstracts of papers describing the attacks, so rules do not fire on the paper that names the attack)
- The 6-check quality gate (schema validation, own-TP-must-match, benign corpus FP, research-mention FP, cross-rule conflict, per-PR cap) runs on every contribution PR
- Operational cadence is 2 hours 16 minutes from MSRC Semantic Kernel CVE disclosure (2026-05-07) to npm-published detection rules (2026-05-11)
- The OSCAL AI RMF catalogue ([github.com/Agent-Threat-Rule/ai-rmf-oscal-catalog](https://github.com/Agent-Threat-Rule/ai-rmf-oscal-catalog)) ships under CC0 covering all 4 AI RMF functions with 72 controls + 31 cross-reference links

## Honest about limits

- **Regex / structured-pattern detection** does not catch paraphrase bypasses. An attacker rewriting a canonical prompt-injection payload into novel phrasing will not match ATR rules.
- **Multilingual coverage** is predominantly English-language today. Japanese-language extension is in progress via Japan AISI aisev#24 engagement; German-language extension via CISPA collaboration discussion.
- **Configuration / authentication attacks** with no runtime payload to pattern-match are out of scope. Detection rules are not a substitute for system-level architectural controls.
- **Novel attack families** with no published precedent will not be covered until a precedent exists. ATR responds fast to disclosed precedents but does not predict zero-day classes.
- **Bus factor** as of 2026-05-12: single core maintainer (Adam Lin), commitment to second maintainer by end of Q2 2026.

## How Five Eyes agency staff can engage

Three paths, by lift required:

**Low lift (review)** — Read this document, the [main repo](https://github.com/Agent-Threat-Rule/agent-threat-rules), and the [GOVERNANCE.md](https://github.com/Agent-Threat-Rule/agent-threat-rules/blob/main/GOVERNANCE.md). Provide written feedback via issue or email. No commitment.

**Medium lift (consult)** — Schedule a 30-minute video review of the mapping table with the maintainer. Identify which rule subset(s) match an existing agency-specific concern (e.g. ACSC's RedSpice priorities, CCCS's "Careful Adoption" follow-on, CISA's KEV pipeline). Decide whether ATR rule output would be useful as a data feed in your existing incident response surfaces.

**High lift (reference)** — Name the open detection-rule layer (plural: ATR, garak, HarmBench, AgentDojo, JailbreakBench, OWASP A-S-R-H) in your next Careful-Adoption follow-on publication or in your agency's agentic-AI guidance. The reference need not single-out ATR; the value is establishing that open detection-rule infrastructure exists and is operationally serious.

## Contact

Adam Lin, founding maintainer, Agent Threat Rules
adam@agentthreatrule.org
Legal entity: Panguard AI Inc. (Delaware C-Corp, filed 2026-05-12)
Open standard: MIT, forever, per GOVERNANCE.md commitment
