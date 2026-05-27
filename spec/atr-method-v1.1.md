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

## 5. Signature Method

Section 5 of this document is reserved for the signature method. v1.1 leaves the signature method as a normative placeholder; the wire format will be specified before promotion to Final, based on the canonical hash field already in use by existing implementations.

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

A Trace Rule expresses one or more of three primitives, evaluated against the Trace as a span DAG:

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

An Engine MUST publish its capability set in any conformance claim.

A Rule with `method: X` where X is not in the Engine's capability set MUST be skipped silently rather than rejected. Skipping MUST be reported in the per-evaluation metadata so operators can audit coverage.

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
