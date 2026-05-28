/**
 * Trace-method rule evaluator.
 *
 * Implements the formal semantics in atr-method-v1.1.md §8 for the three
 * trace primitives: forbid, require, invariant. Operates on a Trace (DAG
 * of spans, OpenInference / OTel GenAI format).
 *
 * Capability: atr/method/trace (per atr-method-v1.1.md §9).
 *
 * Pure function; no I/O. Engine wires this in via evaluateRule dispatch
 * when detection.method === 'trace'.
 */

import type {
  ATRRule,
  ATRTrace,
  ATRSpan,
  ATRSpanShape,
  ATRTraceForbid,
  ATRTraceRequire,
  ATRTraceInvariant,
} from "./types.js";

/** Normalize a span's "kind" — accept either span.kind (OpenInference) or kind (OTel) */
function getSpanKind(span: ATRSpan): string | undefined {
  return span["span.kind"] ?? span.kind;
}

/** Resolve `${span.attributes.<path>}` placeholder against the candidate span */
function resolvePlaceholder(value: unknown, candidateSpan: ATRSpan): unknown {
  if (typeof value !== "string") return value;
  const m = value.match(/^\$\{span\.attributes\.(.+)\}$/);
  if (!m) return value;
  const path = m[1];
  return readAttributePath(candidateSpan.attributes ?? {}, path);
}

/** Read dotted-path attribute, e.g., "tool.args.target_conversation_id" */
function readAttributePath(attrs: Record<string, unknown>, path: string): unknown {
  // Try literal-key first (covers cases like "session.id" stored as a literal key with a dot)
  if (path in attrs) return attrs[path];
  // Then walk dotted path
  const parts = path.split(".");
  let cur: unknown = attrs;
  for (const part of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
    if (cur === undefined) return undefined;
  }
  return cur;
}

/** Evaluate a single attribute predicate against a value. Returns boolean. */
function evaluatePredicate(predicate: unknown, value: unknown): boolean {
  if (predicate === null || predicate === undefined) {
    return value === predicate;
  }
  // Literal equality
  if (typeof predicate !== "object") {
    return value === predicate;
  }
  const pred = predicate as Record<string, unknown>;
  // Compound predicate object: { in: [...] } / { not_equals: X } / etc.
  if (Array.isArray(pred["in"]) && (pred["in"] as unknown[]).includes(value)) return true;
  if (Array.isArray(pred["in"]) && !(pred["in"] as unknown[]).includes(value)) return false;
  if (Array.isArray(pred["not_in"])) {
    return !(pred["not_in"] as unknown[]).includes(value);
  }
  if ("equals" in pred) return value === pred["equals"];
  if ("not_equals" in pred) return value !== pred["not_equals"];
  if ("exists" in pred) {
    const requiredExists = Boolean(pred["exists"]);
    return requiredExists ? value !== undefined : value === undefined;
  }
  if ("regex" in pred && typeof pred["regex"] === "string") {
    try {
      const re = new RegExp(pred["regex"] as string);
      return typeof value === "string" && re.test(value);
    } catch {
      return false;
    }
  }
  if (Object.keys(pred).length === 0) return true;
  // Unknown predicate object — strict: return false rather than assume.
  return false;
}

/** Check if a span matches a shape. Handles literal values + predicate maps + placeholders. */
function spanMatchesShape(span: ATRSpan, shape: ATRSpanShape): boolean {
  if (shape["span.kind"] !== undefined) {
    const kind = getSpanKind(span);
    if (kind !== shape["span.kind"]) return false;
  }
  const attrPredicates = shape.attributes ?? {};
  for (const [path, predicate] of Object.entries(attrPredicates)) {
    const actual = readAttributePath(span.attributes ?? {}, path);
    const resolved = resolvePlaceholder(predicate, span);
    // Compound predicate map?
    if (
      resolved !== null &&
      typeof resolved === "object" &&
      !Array.isArray(resolved)
    ) {
      // Resolve ${...} inside compound predicates first
      const resolvedPred: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(resolved as Record<string, unknown>)) {
        resolvedPred[k] = resolvePlaceholder(v, span);
      }
      if (!evaluatePredicate(resolvedPred, actual)) return false;
    } else {
      // Literal value (after placeholder resolution if any)
      if (!evaluatePredicate(resolved, actual)) return false;
    }
  }
  return true;
}

/** Check the preceded_by clause; accepts single shape OR one_of_shapes disjunction. */
function checkPrecededBy(
  trace: ATRTrace,
  upToIndex: number,
  precededBy: ATRSpanShape | { one_of_shapes: ATRSpanShape[] },
): boolean {
  const shapes: ATRSpanShape[] =
    "one_of_shapes" in precededBy
      ? (precededBy as { one_of_shapes: ATRSpanShape[] }).one_of_shapes
      : [precededBy as ATRSpanShape];
  for (let i = 0; i < upToIndex; i++) {
    const s = trace.spans[i];
    for (const shape of shapes) {
      if (spanMatchesShape(s, shape)) return true;
    }
  }
  return false;
}

/** Evaluate a single forbid primitive. Returns array of violation descriptions. */
function evaluateForbid(trace: ATRTrace, forbid: ATRTraceForbid): string[] {
  const violations: string[] = [];
  for (let i = 0; i < trace.spans.length; i++) {
    const span = trace.spans[i];
    if (!spanMatchesShape(span, forbid.shape)) continue;
    if (forbid.preceded_by) {
      const hasPredecessor = checkPrecededBy(trace, i, forbid.preceded_by);
      if (hasPredecessor) {
        violations.push(`forbid: span ${span.id} matches shape AND predecessor present`);
      }
    } else {
      violations.push(`forbid: span ${span.id} matches forbidden shape`);
    }
  }
  return violations;
}

/** Evaluate a single require primitive. Returns array of violation descriptions
 *  (NB: violation = expected predecessor MISSING, per §8.3.2 inverse polarity). */
function evaluateRequire(trace: ATRTrace, req: ATRTraceRequire): string[] {
  const violations: string[] = [];
  for (let i = 0; i < trace.spans.length; i++) {
    const span = trace.spans[i];
    if (!spanMatchesShape(span, req.target_shape)) continue;
    const hasRequired = checkPrecededBy(trace, i, req.must_be_preceded_by);
    if (!hasRequired) {
      violations.push(`require: span ${span.id} matches target but predecessor missing`);
    }
  }
  return violations;
}

/** Group spans by the across-key value (chain id / session / conversation). */
function groupByAcross(trace: ATRTrace, across: ATRTraceInvariant["across"]): Map<string, ATRSpan[]> {
  const groups = new Map<string, ATRSpan[]>();
  for (const span of trace.spans) {
    let key: string | undefined;
    if (across === "trace") {
      key = trace.trace_id ?? "_trace_";
    } else if (across === "agent.delegation_chain") {
      key = readAttributePath(span.attributes ?? {}, "agent.delegation_chain") as
        | string
        | undefined;
    } else if (across === "session") {
      key = readAttributePath(span.attributes ?? {}, "session.id") as string | undefined;
    } else if (across === "conversation") {
      key =
        (readAttributePath(span.attributes ?? {}, "gen_ai.conversation.id") as string) ??
        (readAttributePath(span.attributes ?? {}, "conversation.id") as string);
    }
    if (key === undefined) continue;
    const list = groups.get(key) ?? [];
    list.push(span);
    groups.set(key, list);
  }
  return groups;
}

/** Evaluate a single invariant primitive. */
function evaluateInvariant(trace: ATRTrace, inv: ATRTraceInvariant): string[] {
  const violations: string[] = [];
  const groups = groupByAcross(trace, inv.across);
  for (const [key, spans] of groups.entries()) {
    if (spans.length < 2) continue;
    const firstVal = readAttributePath(spans[0].attributes ?? {}, inv.attribute);
    for (let i = 1; i < spans.length; i++) {
      const v = readAttributePath(spans[i].attributes ?? {}, inv.attribute);
      // If both undefined, no violation. If diverge, violation.
      if (firstVal === undefined && v === undefined) continue;
      if (firstVal !== v) {
        violations.push(
          `invariant: ${inv.attribute} drifts across ${inv.across}="${key}" (first=${JSON.stringify(firstVal)}, span ${spans[i].id}=${JSON.stringify(v)})`,
        );
        break; // one violation per group is sufficient
      }
    }
  }
  return violations;
}

export interface TraceEvaluationResult {
  matched: boolean;
  violations: string[];
  matchedPrimitives: ("forbid" | "require" | "invariant")[];
}

/** Top-level trace rule evaluator. Returns matched=true if ANY declared
 *  primitive evaluates to violation. */
export function evaluateTraceRule(rule: ATRRule, trace: ATRTrace): TraceEvaluationResult {
  const t = rule.detection.trace;
  if (!t) {
    return { matched: false, violations: [], matchedPrimitives: [] };
  }
  const allViolations: string[] = [];
  const matchedPrimitives: ("forbid" | "require" | "invariant")[] = [];

  for (const f of t.forbid ?? []) {
    const v = evaluateForbid(trace, f);
    if (v.length > 0) {
      allViolations.push(...v);
      matchedPrimitives.push("forbid");
    }
  }
  for (const r of t.require ?? []) {
    const v = evaluateRequire(trace, r);
    if (v.length > 0) {
      allViolations.push(...v);
      matchedPrimitives.push("require");
    }
  }
  for (const inv of t.invariant ?? []) {
    const v = evaluateInvariant(trace, inv);
    if (v.length > 0) {
      allViolations.push(...v);
      matchedPrimitives.push("invariant");
    }
  }

  return {
    matched: allViolations.length > 0,
    violations: allViolations,
    matchedPrimitives,
  };
}
