# ATR Method Extensions v1.1

Version: 1.1.0
Status: Draft
Date: 2026-05-28
License: MIT
Editor: Adam Lin (林冠辛) <adam@agentthreatrule.org>
Numbering Authority: ATR Technical Committee (transitional BDFL until TSC seated)
Extends: SPEC.md v1.0.0 §6

---

## 1. Abstract

This document extends [SPEC.md](../SPEC.md) v1.0.0 with optional detection methods beyond the pattern-only model of v1.0. It defines four additional methods — `signature`, `semantic`, `behavioral`, `trace` — under one orthogonal field `detection.method`. Rules MAY declare a method to opt into method-specific evaluation semantics; absence of the field means `method: pattern` and v1.0 evaluation applies.

The motivating gap is that v1.0 covers input-text regex detection but not (a) silent failures in agent reasoning (paraphrased prompt injection, scope drift, premise violation), (b) LLM-as-judge semantic intent classification, or (c) declarative assertions over agent execution traces. v1.1 adds these without breaking v1.0 conformance.

## 2. Status of This Document

This is a Draft of ATR Method Extensions v1.1.0. The Draft is stable for implementation. The five detection methods enumerated here (pattern, signature, semantic, behavioral, trace) are the canonical set for v1.1; new methods MUST be introduced by Spec amendment per GOVERNANCE.md, not by individual Rule authors.

This document does not modify any v1.0 wire format. Rules without `detection.method` continue to be valid v1.0 Pattern rules. Engines that implement only v1.0 conformance MUST skip rules whose `method` value is not `pattern` rather than reject them, per Section 7.

## 3. Conventions and Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174].

| Term | Definition |
|------|-----------|
| Method | The detection technique a Rule uses, declared in `detection.method`. One of: pattern, signature, semantic, behavioral, trace. |
| Plane | Informal synonym for Method used in ATR architectural prose. |
| Judge | An LLM (or smaller classifier) that evaluates an Input against a prompt template and returns a structured verdict. Used by Semantic method only. |
| Trace | A directed-acyclic graph of spans representing one or more agent execution turns, ingested in OpenInference or OTel GenAI semantic conventions format. Used by Trace method only. |

## 4. Method Catalog (Overview)

| Method | Required Companion Field | What It Detects | Latency Tier |
|--------|--------------------------|-----------------|--------------|
| pattern | `detection.conditions` (per SPEC §6) | Regex/string match on text fields | < 5 ms |
| signature | `detection.signature` (§5) | Known-bad hash / package name / registry URL | < 1 ms |
| semantic | `detection.semantic` (§6) | Paraphrased / roleplay / encoded intent | < 2 s |
| behavioral | `detection.behavioral` (§7) | Metric threshold over a time window | < 100 ms |
| trace | `detection.trace` (§8) | Silent failure / scope drift / premise violation over agent execution graph | < 200 ms |

Engines MUST implement `pattern` for any conformance level. Other methods are OPTIONAL; an Engine declaring conformance MUST declare which methods it implements.

### 4.1 Runtime Profiles

Engines MAY declare conformance against one of two Runtime Profiles, which group the methods by latency and operational characteristics:

| Profile | Methods Included | Latency Budget | Use Case |
|---------|------------------|----------------|----------|
| `deterministic` | signature + pattern | < 5 ms total | Production hot path, sub-millisecond enforcement, no external dependencies |
| `assisted` | semantic + behavioral + trace | up to 2 s | Sidecar / async path; may call LLM judge, ingest traces, or evaluate metric windows |

A Rule's declared `detection.method` implies its profile. Engines that support only the `deterministic` profile MUST skip Rules whose method is in `assisted` (per §9), not reject them.

This split is intended to let production policy engines (e.g., enterprise governance toolkits, in-line security scanners) load only deterministic Rules into their hot path while delegating assisted-tier Rules to an async sidecar. The same Rule corpus serves both deployment patterns; no Rule rewrite is required.

Profile capability is declared as `atr/profile/deterministic` or `atr/profile/assisted` in the Engine's conformance statement.

## 5. Signature Method

### 5.1 Purpose

The Signature method detects known-bad artifacts by exact-match on stable identifiers (cryptographic hashes, package names, registry URLs). Unlike Pattern (which allows fuzzy text match) or Semantic (which infers intent), Signature requires an exact match against a canonical indicator. This is the fastest detection method (sub-millisecond), making it suitable for production hot paths.

The method is modeled on Cyber Threat Intelligence Indicator-of-Compromise (IOC) practice, adapted for AI agent artifacts: skill files, MCP tool packages, agent configurations, and registry locations. Existing tools that ship YARA-based scanning (e.g., production skill scanners) can consume Signature Rules via the ATR→YARA compiler contract in §5.4.

### 5.2 Required Fields

A Rule with `method: signature` MUST declare `detection.signature` with:

| Field | Type | Constraint |
|-------|------|-----------|
| `indicators` | array | Non-empty list of indicator objects (§5.2.1). |
| `match_logic` | enum | One of `any` (Rule matches if any indicator matches) or `all` (Rule matches only if every indicator matches). Defaults to `any`. |

#### 5.2.1 Indicator object

| Field | Type | Constraint |
|-------|------|-----------|
| `type` | enum | One of: `sha256`, `sha512`, `blake2b-256`, `package_name`, `registry_url`, `skill_id`. |
| `value` | string | Indicator value. Hash types MUST be hex-encoded (lowercase, no `0x` prefix). |
| `target_field` | string | Source field to match against (e.g., `skill.content`, `skill.manifest.name`, `mcp.tool.source_url`). |
| `provenance` | object | OPTIONAL. `{first_observed, source, attribution}` for forensic chain. |

### 5.3 Evaluation Semantics

For Input I and Rule R with method=signature:

1. For each indicator `i` in `R.signature.indicators`:
   - Compute or extract value `v` from `I[i.target_field]` per `i.type`:
     - Hash types: compute the digest over `I[i.target_field]` bytes.
     - String types (`package_name`, `registry_url`, `skill_id`): read `I[i.target_field]` as a UTF-8 string.
   - Indicator matches iff `v == i.value` after the normalization rules in §5.3.1.
2. Apply `match_logic`:
   - `any`: Engine MUST emit a Match if ANY indicator matched.
   - `all`: Engine MUST emit a Match only if EVERY indicator matched.

Engines MUST treat unknown indicator `type` values as a graceful_error per SPEC §6, not as a silent no-match.

#### 5.3.1 Normalization

- Hash hex strings: lowercase, no separator, no `0x` prefix. Engines MUST normalize both sides before comparison.
- `package_name` and `skill_id`: case-sensitive string equality.
- `registry_url`: canonical form per RFC 3986 §6 (lowercase scheme + host, no trailing slash, no fragment). Engines MUST normalize both sides before comparison.

### 5.4 ATR→YARA Compiler Compatibility

Signature Rules are designed to be compilable to YARA rule format for ecosystems that already consume YARA (e.g., production skill scanners, VirusTotal-class infrastructure). A normative ATR→YARA compiler specification will be published as `spec/atr-compiler-yara-v1.0.md` in a follow-up. The compilation contract is:

| ATR Indicator | YARA equivalent |
|--------------|----------------|
| `sha256` | `hash.sha256(0, filesize)` module condition with literal hash |
| `sha512` | `hash.sha512(0, filesize)` module condition with literal hash |
| `package_name` | `strings.$name = "<value>"` with `condition: $name` |
| `registry_url` | `strings.$url = "<value>"` with `condition: $url` |
| `skill_id` | `strings.$id = "<value>"` with `condition: $id` |
| `match_logic: all` | YARA `condition: all of them` |
| `match_logic: any` | YARA `condition: any of them` |

The ATR→YARA compiler is OPTIONAL infrastructure; non-implementing engines do not lose conformance. Engines that publish YARA outputs MUST declare the `atr/compiler/yara@1.0` capability.

### 5.5 Example

```yaml
id: ATR-YYYY-DRAFT-skill-malware-example
title: "Known-bad skill: @malicious/persistence-rootkit"
status: draft
severity: critical
tags:
  category: skill-compromise
  scan_target: skill
detection:
  method: signature
  signature:
    match_logic: any
    indicators:
      - type: sha256
        value: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
        target_field: skill.content
        provenance:
          first_observed: "2026-05-27"
          source: "Wild scan corpus"
          attribution: "Public skill registry"
      - type: package_name
        value: "@malicious/persistence-rootkit"
        target_field: skill.manifest.name
response:
  actions: [block_request, log_alert]
test_cases:
  true_positives:
    - input: { skill.content: "<full byte content matching hash>" }
      expected: triggered
  true_negatives:
    - input: { skill.manifest.name: "@safe/normal-skill" }
      expected: not_triggered
```

### 5.6 Provenance and Trust

Signature Rules carry forensic weight: a hash match means "this exact artifact was previously confirmed malicious." Engines MUST preserve the `provenance` field in Match output (per SPEC §7) to permit downstream attribution and dispute resolution. Engines SHOULD NOT auto-block on a hash match without operator policy explicitly enabling it; the default response action SHOULD be `log_alert` until provenance is operator-trusted.

## 6. Semantic Method

### 6.1 Purpose

The Semantic method detects threats whose surface form bypasses pattern-level regex but whose intent is identifiable by a Judge. Examples: paraphrased prompt injection, roleplay-cloaked jailbreak, base64-decoded instruction override, and indirect injection via untrusted retrieval.

### 6.2 Required Fields

A Rule with `method: semantic` MUST declare `detection.semantic` with:

| Field | Type | Constraint |
|-------|------|-----------|
| `judge_model_class` | string | One of: `gpt-4-class`, `claude-haiku-class`, `claude-opus-class`, `llama-prompt-guard`, `llama-3-class`, `local`. Indicates capability class, not a specific vendor SKU. |
| `prompt_template` | string | MUST contain `{{input}}` placeholder. Engine substitutes the Input verbatim. |
| `output_schema` | object | JSON Schema fragment for the expected Judge response. MUST include at minimum `category` (string) and `confidence` (number 0.0-1.0). |
| `threshold` | number | Minimum `confidence` to count as a Match. Range 0.0-1.0. |

### 6.3 Optional Fields

| Field | Type | Constraint |
|-------|------|-----------|
| `cache_ttl` | integer | Seconds. Engine MAY cache `(prompt_hash, input_hash) → verdict` for this duration. |
| `judge_prompt_hash` | string | SHA-256 of the canonical Judge prompt at rule authoring time. Used for regression-testing the prompt itself. |
| `fallback_method` | string | One of `pattern` or `none`. Behavior when Judge is unavailable. |
| `consensus` | object | Multi-judge requirement: `{n: integer, agreement: float}`. Match requires `n` judges agreeing above `agreement` threshold. |

### 6.4 Evaluation Semantics

For Input I and Rule R with method=semantic:

1. Engine MAY check cache for `(R.semantic.judge_prompt_hash, hash(I))`.
2. If miss: Engine substitutes I into R.semantic.prompt_template, calls Judge, parses response per R.semantic.output_schema.
3. Engine MUST emit a Match iff parsed response has `confidence >= R.semantic.threshold`.
4. If Judge call fails and R.semantic.fallback_method is `pattern`, Engine MUST evaluate any pattern-mode conditions present in R as a fallback. If `none`, Engine MUST emit a graceful_error rather than a Match.

### 6.5 Regression Testing

Rules with method=semantic SHOULD ship calibration evidence as `test_cases`:
- `true_positives`: ≥5 Inputs the Judge produces `confidence >= threshold` for, with the Rule's `judge_prompt_hash`.
- `true_negatives`: ≥5 Inputs that score below threshold.
- The Engine's conformance runner MAY run these against a canonical Judge stub to detect prompt drift.

Calibration methodology adapted from the Promptfoo `llm-rubric` workflow [PROMPTFOO]; consensus-of-N methodology from [LLM-JURY].

## 7. Behavioral Method

Section 7 is reserved for the behavioral method, which expresses metric thresholds over time windows (e.g., "tool_calls_per_session > 50 within 5m"). v1.1 leaves the wire format as a normative placeholder; the required fields will follow the named-map shape already in the schema's secondary detection format (`metric`, `operator`, `threshold`, `window`).

## 8. Trace Method

### 8.1 Purpose

The Trace method detects threats that manifest as patterns in agent execution rather than in input text: silent failure (no error, wrong output), premise drift (agent treats user-scoped context as global), scope violation across multi-agent delegation chains, and tool-misuse sequences whose individual steps are benign.

These threats are out of scope for v1.0 Pattern detection by construction.

### 8.2 Ingest Format

A Trace Engine MUST ingest spans in one of:

- **OpenInference** [OPENINFERENCE] — the Arize-led, Apache-2.0 trace schema with 20+ framework adoption (LangChain, LlamaIndex, OpenAI Agents SDK, CrewAI, MCP, Claude Agent SDK, Vercel AI, Pydantic AI, Spring AI, smolagents, BeeAI, Haystack, others). v1.1 RECOMMENDS OpenInference as default.
- **OTel GenAI Semantic Conventions** [OTEL-GENAI] — the OpenTelemetry standard for GenAI spans. Currently in Development for agent spans. v1.1 PERMITS this as ingest format for forward compatibility.

Rules MUST declare `detection.trace.ingest_format`. Engines MUST reject rules whose declared format they do not implement, with a clear error message.

### 8.3 Three Primitives

A Trace Rule expresses one or more of three primitives, evaluated against the Trace as a span DAG.

#### Attribute matchers — predicate vocabulary

Inside a primitive's `shape`, `target_shape`, or `must_be_preceded_by` blocks, attribute matchers MAY be either literal value matchers or richer predicate maps. The following predicates are normative for v1.1:

| Predicate | Semantics |
|-----------|-----------|
| `<literal>` | Exact equality. e.g., `tool.name: email.send` matches iff `attributes["tool.name"] == "email.send"`. |
| `in: [A, B, C]` | Set membership. Matches iff attribute value is in the list. |
| `not_in: [A, B, C]` | Inverse of `in`. |
| `equals: <value>` | Explicit equality (same as literal). |
| `not_equals: <value>` | Inequality. |
| `regex: "<pattern>"` | ECMAScript regex match on stringified attribute value. |
| `exists: true\|false` | Attribute presence check. |

#### Cross-attribute references

A predicate value MAY contain the placeholder `${span.attributes.<path>}` to reference another attribute of the same span being matched. Engines MUST resolve the placeholder against the candidate span's attributes before evaluating the predicate. This permits within-span invariants such as "target identifier must equal active identifier":

```yaml
forbid:
  - shape:
      span.kind: "TOOL"
      attributes:
        tool.args.target_conversation_id:
          not_equals: "${span.attributes.conversation.id}"
```

Cross-span placeholder references (`${trace.spans[N].attributes.X}`) are NOT permitted in v1.1; cross-span invariants MUST use the `invariant` primitive in §8.3.3.

#### Shape disjunctions — `one_of_shapes`

A `preceded_by` or `must_be_preceded_by` block MAY use `one_of_shapes` to express a disjunction of candidate shapes. The primitive matches if ANY shape in the list matches a preceding span. This is the only normative disjunction primitive in v1.1; engines MUST evaluate each shape independently and short-circuit on first match:

```yaml
must_be_preceded_by:
  one_of_shapes:
    - span.kind: "HUMAN"
    - span.kind: "AGENT"
      attributes:
        human_approval: true
  within_trace: true
```

Other disjunction forms (`any_of`, top-level `one_of`) are NOT defined in v1.1. Rules using them MUST be treated as malformed.

#### 8.3.1 `forbid` — Span Shape That MUST NOT Appear

```yaml
detection:
  method: trace
  trace:
    ingest_format: openinference
    forbid:
      - shape:
          span.kind: TOOL
          attributes:
            tool.name: email.send
          preceded_by:
            span.kind: RETRIEVER
            attributes:
              source: untrusted
```

Semantics: Match iff there exists a span `s` in the Trace where `s` matches the shape AND (if `preceded_by` is present) there exists an earlier span `s'` matching `preceded_by` in the same Trace.

#### 8.3.2 `require` — Span Shape That MUST Precede Another

```yaml
detection:
  method: trace
  trace:
    ingest_format: openinference
    require:
      - target_shape:
          span.kind: TOOL
          attributes:
            tool.privilege: destructive
        must_be_preceded_by:
          span.kind: AGENT
          attributes:
            human_approval: true
```

Semantics: Match (anomaly) iff there exists a span `s` matching `target_shape` AND there does NOT exist an earlier span `s'` matching `must_be_preceded_by` in the same Trace.

This is the inverse polarity of `forbid`: the rule fires when an expected predecessor is *missing*. This is the only v1.1 primitive that detects absence rather than presence — and is the primary mechanism for catching silent failures.

#### 8.3.3 `invariant` — Attribute That MUST Hold Across Spans

```yaml
detection:
  method: trace
  trace:
    ingest_format: openinference
    invariant:
      - attribute: session.id
        across: trace
      - attribute: user.id
        across: agent.delegation_chain
```

Semantics: Match (anomaly) iff there exist two spans `s1`, `s2` in the domain (`across`) such that `s1.attributes[attribute] != s2.attributes[attribute]`.

`across` MUST be one of:
- `trace` — all spans in the Trace
- `agent.delegation_chain` — all spans within one delegation chain (joined by OpenInference `agent.delegation_chain[*]`)
- `session` — all spans sharing one `session.id`
- `conversation` — all spans sharing one `gen_ai.conversation.id` (OTel ingest only)

### 8.4 Composition

A Trace Rule MAY declare multiple primitives. The Rule matches iff the boolean expression in `detection.condition` evaluates to true over the named primitives.

If `detection.condition` is absent, the default is `any of *` — Rule matches if any primitive matches.

### 8.5 Evaluation Determinism

Trace evaluation MUST be deterministic for a fixed Trace input. Engines MUST NOT introduce randomization, time-of-day branching, or sampling into Trace evaluation. This is identical to SPEC §6.4 and applies normatively.

### 8.6 Performance Considerations

Trace evaluation is OPTIONAL; not all Engines need to implement it. An Engine claiming `trace` capability:

- SHOULD set a per-Rule per-Trace timeout (RECOMMENDED: 200 ms).
- SHOULD reject Traces exceeding a configurable maximum span count (RECOMMENDED: 10,000 spans).
- MUST treat malformed Traces as graceful_error rather than no-match, so authoring mistakes are surfaced.

## 9. Conformance Implications

This document does not alter SPEC.md §11 (Conformance Levels). It adds the following capability declarations that an Engine MAY make:

| Capability | Statement | What the Engine implements |
|------------|-----------|----------------------------|
| `atr/method/pattern` | REQUIRED for any conformance level. | v1.0 §6 evaluation. |
| `atr/method/signature` | OPTIONAL. | §5 evaluation. |
| `atr/method/semantic` | OPTIONAL. | §6 evaluation. |
| `atr/method/behavioral` | OPTIONAL. | §7 evaluation. |
| `atr/method/trace` | OPTIONAL. | §8 evaluation. |
| `atr/profile/deterministic` | OPTIONAL. Implies `atr/method/pattern` + `atr/method/signature`. | §4.1 — production hot-path engines. |
| `atr/profile/assisted` | OPTIONAL. Implies `atr/method/semantic` + `atr/method/behavioral` + `atr/method/trace`. | §4.1 — sidecar / async engines. |
| `atr/compiler/yara@1.0` | OPTIONAL. | §5.4 — emits YARA rules from Signature Rules. |

An Engine MUST publish its capability set in any conformance claim.

A Rule with `method: X` where X is not in the Engine's capability set MUST be skipped silently rather than rejected. Skipping MUST be reported in the per-evaluation metadata so operators can audit coverage.

### 9.1 OSCAL Evidence Integration

Rules MAY declare `references.oscal_assessment_objective` to act as an evidence source beneath an OSCAL-driven Assessment Plan / Result. An Engine that emits OSCAL Assessment Results (per `spec/atr-event-v1.0.md` OSCAL mapping) MUST include the Rule's match output as `observations[]` evidence for each referenced objective ID.

This is the bridge from runtime detection into compliance assessment workflows. Operators running OSCAL-based audit pipelines (e.g., FedRAMP automation, NIST AI RMF assessment) can consume ATR matches as machine-readable evidence without reauthoring rules in OSCAL's component-definition vocabulary.

### 9.2 Probe Binding (Red-Team Coverage)

Rules MAY declare `references.probe_id` to bind the Rule to one or more adversarial probes (red-team generators) whose output the Rule is designed to detect. Format is `<framework>:<probe-name>`, e.g., `pyrit:indirect_pi_v2` or `garak:promptinject.HijackHateHumans`.

This explicit pairing closes the loop between adversarial generation and detection:

- A red-team harness running probe `P` MUST be able to query the Rule corpus for all Rules with `probe_id` containing `P`, and run them against the probe's output to measure detection coverage.
- A Rule author MAY claim coverage of probe `P` by binding to it; the claim is testable by any party with access to the probe runner.
- The Engine SHOULD report per-probe detection rate as part of evaluation metadata when the operator supplies a probe identifier with the input.

This is the inverse direction of §6.5's calibration workflow: §6.5 ensures the Judge prompt holds up over time; §9.2 ensures the rule survives against newly-generated adversarial input.

### 9.3 NIST CSF 2.0 / ETSI TS 104 223 Crosswalks

Rules MAY declare `references.nist_csf` and `references.etsi_ts_104223` to align with the two major sovereign cybersecurity frameworks for AI agents:

- `nist_csf`: NIST CSF 2.0 subcategory IDs (e.g., `DE.CM-09`, `PR.IR-01`). Required for citation in NIST IR 8596 Cyber AI Profile Informative References.
- `etsi_ts_104223`: ETSI TS 104 223 principle/sub-principle IDs (e.g., `P4.3`). ETSI TS 104 223 upstreamed UK NCSC's AI Cyber Code of Practice; this binding lets ATR Rules be cited in NCSC Implementation Guides.

Both fields are arrays of strings to permit multi-framework alignment per Rule.

## 10. Security and Privacy Considerations

### 10.1 Semantic Method: Judge Input Confidentiality

When `prompt_template` includes the Input, the full Input is sent to the Judge. Engines MUST redact PII per SPEC §13.3 before constructing the prompt, OR provide an explicit operator opt-out documented per deployment.

### 10.2 Trace Method: Trace Confidentiality

Trace data may include user-side PII, system prompts, tool credentials, and intermediate model output. Engines MUST NOT log raw trace contents at INFO level or higher without explicit operator configuration, and MUST redact `attributes.tool.args` when emitting Match output per SPEC §13.3.

### 10.3 Judge Prompt Injection

The prompt_template is part of the trusted Rule, but the Input is untrusted. Authors MUST follow Microsoft Spotlighting [SPOTLIGHTING] practices to delineate trusted instructions from untrusted Input in the template.

## 11. References

### 11.1 Normative

- [SPEC] ATR Core Specification v1.0.0 — this repository, `SPEC.md`.
- [RFC2119] / [RFC8174] — BCP 14 normative language.

### 11.2 Informative

- [OPENINFERENCE] Arize AI, "OpenInference Semantic Conventions", https://github.com/Arize-ai/openinference
- [OTEL-GENAI] OpenTelemetry, "GenAI Semantic Conventions", https://opentelemetry.io/docs/specs/semconv/gen-ai/
- [PROMPTFOO] Promptfoo, "LLM-as-a-Judge Calibration Guide", https://www.promptfoo.dev/docs/guides/llm-as-a-judge/
- [LLM-JURY] "LLM Jury-on-Demand", arXiv:2512.01786
- [SPOTLIGHTING] Microsoft, "Prompt Shields Spotlighting", Build 2025.
- [AGENTARMOR] "AgentArmor: Type-System for Agent Trace Analysis", arXiv:2508.01249
- [TRACEAEGIS] "TraceAegis: Behavioral Constraints over Agent Execution Traces", arXiv:2510.11203
- [GOAL-DRIFT] Arike et al., "Evaluating Goal Drift in LM Agents", arXiv:2505.02709

## Appendix A. Changelog Against v1.0

| Change | Source |
|--------|--------|
| Introduced `detection.method` optional field | This document |
| Added `signature`, `semantic`, `behavioral`, `trace` methods | This document |
| Added `agent_trace` to `agent_source.type` enum | This document |
| Defined OpenInference + OTel GenAI as Trace ingest formats | This document |
| Defined three Trace primitives: `forbid`, `require`, `invariant` | This document |
| Specified capability-based conformance for method extensions | This document |

All changes are MINOR per SPEC §10. Rules without `detection.method` continue to be valid v1.0 Pattern rules without modification.
