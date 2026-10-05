// Aggregation: turning a catalog, a policy and a set of observations into a verdict.
//
// FOUR SEPARATE VOCABULARIES, DELIBERATELY NOT MERGED.
//
//   STATUS       what the project is, overall
//   RESULT       what happened to one rule
//   DISPOSITION  why that happened
//   DISTINCTION  the brief's six-way presentation value, DERIVED from the other three
//
// The temptation is to collapse these into one enum. Resisting it is what lets the output say
// "skipped because the rule has no subject here" and "skipped because nobody looked" in a way a
// consumer can act on differently — which is the entire point of the brief's six-way requirement.

export const STATUS = {
  COMPLIANT: "COMPLIANT",
  COMPLIANT_WITH_EXCEPTIONS: "COMPLIANT_WITH_EXCEPTIONS",
  NON_COMPLIANT: "NON_COMPLIANT",
  NOT_EVALUATED: "NOT_EVALUATED",
  BLOCKED_BY_INVARIANT: "BLOCKED_BY_INVARIANT",
};

export const RESULT = {
  passed: "passed",
  failed: "failed",
  warning: "warning",
  skipped: "skipped",
};

export const DISPOSITION = {
  evaluated: "evaluated",
  notEvaluated: "not-evaluated",
  notApplicable: "not-applicable",
  excepted: "excepted",
  attested: "attested",
};

export const DISTINCTION = {
  passed: "passed",
  failed: "failed",
  warning: "warning",
  skipped: "skipped",
  notEvaluated: "not-evaluated",
  prohibitedButUnestablished: "prohibited-but-unestablished",
};

/**
 * The six-way distinction, as a pure function of (result, disposition, level).
 *
 * It is DERIVED and never stored, so it cannot drift from the vocabularies it summarises, and it can
 * never carry information they do not already hold. A test recomputes it independently for every
 * result in every fixture and compares.
 *
 * BRANCH ORDER IS LOAD-BEARING. The forbidden branch is tested BEFORE the general not-evaluated
 * branch. A prohibition nobody examined must never be reported merely as "not evaluated", because a
 * consumer scanning for unexamined prohibitions would miss it, and that is the specific false green
 * the brief calls out by name.
 */
export function distinction(result, disposition, level) {
  if (result === RESULT.passed) return DISTINCTION.passed;
  if (result === RESULT.failed) return DISTINCTION.failed;
  if (result === RESULT.warning) return DISTINCTION.warning;

  if (disposition === DISPOSITION.notEvaluated) {
    if (level === "forbidden") return DISTINCTION.prohibitedButUnestablished;
    return DISTINCTION.notEvaluated;
  }
  return DISTINCTION.skipped;
}

/**
 * Evaluate one rule against what was observed.
 *
 * THE AGGREGATION TRUTH TABLE, which is the heart of this file:
 *
 *   confirmed violation + unknown check                         -> failed, carrying ONLY the confirmed finding
 *   no violation       + unknown check                         -> not-evaluated
 *   no violation       + everything known, assurance partial   -> not-evaluated
 *   no violation       + everything known, assurance full      -> passed
 *
 * The second row is the one that matters. A check that could not run is not a check that found
 * nothing, and reporting it as a pass is how a tool comes to certify a repository it never read.
 *
 * The third row is the same requirement for a check that DID run. Standard 5 R6 covers a check that
 * "covered less than the rule requires", and a rule declaring `assurance: partial` says exactly that
 * about its own detector. A clean narrow search establishes that nothing was found inside the scope
 * searched; it establishes nothing outside it, so it is not a pass: it earns no passed credit and holds
 * the status away from COMPLIANT, while the rule, being applicable and evaluable, stays in the scored
 * denominator that evaluate() computes. A confirmed violation from the same detector still stands (first row), and an
 * unknown keeps its own reason (second row): partial assurance never erases a finding.
 */
function evaluateRule(entry, observations, evaluatedRules) {
  const { rule, level, applicable, applicabilityReason } = entry;

  const base = {
    rule: rule.id,
    standardRef: rule.standard,
    level,
    severity: rule.severity,
    assurance: rule.assurance,
    validationType: rule.validationType,
    evidence: [],
    remediation: rule.remediation ?? null,
  };

  if (!applicable) {
    return {
      ...base,
      result: RESULT.skipped,
      disposition: DISPOSITION.notApplicable,
      message: `Declared not applicable: ${applicabilityReason ?? "no reason recorded"}`,
    };
  }

  // A not-evaluable rule is never evaluated by anything, by construction. It is reported so the
  // requirement stays visible, and it changes neither status nor score.
  if (rule.validationType === "not-evaluable") {
    return {
      ...base,
      result: RESULT.skipped,
      disposition: DISPOSITION.notEvaluated,
      message: "Not evaluable by this framework. " + (rule.$notEvaluableNote ?? ""),
    };
  }

  if (!evaluatedRules.includes(rule.id)) {
    // No detector examines this rule. Not a pass — nobody looked.
    return {
      ...base,
      result: RESULT.skipped,
      disposition: DISPOSITION.notEvaluated,
      message:
        rule.validationType === "manual-review"
          ? "Requires human review. No automated check can establish this."
          : "No detector in this release examines this rule.",
    };
  }

  const found = observations.filter((o) => o.rule === rule.id);
  const violations = found.filter((o) => o.violation);
  const unknown = found.some((o) => o.unknown);

  if (violations.length > 0) {
    // A confirmed violation stands even when another check for the same rule could not run: the
    // violation was observed, and an unknown elsewhere does not un-observe it. Only the confirmed
    // findings are carried, so the report never presents an unknown as evidence of the failure.
    return {
      ...base,
      result: level === "recommended" || rule.severity === "warning" ? RESULT.warning : RESULT.failed,
      disposition: DISPOSITION.evaluated,
      evidence: violations.flatMap((o) => o.evidence ?? []),
      message: violations[0].message,
    };
  }

  if (unknown) {
    // Carry the observation's own reason rather than a generic one. "A check could not run" is
    // true but useless; "the walk was shortened by a framework exclusion" tells a reader what to
    // do about it, and a withdrawal nobody can act on gets ignored.
    const reasons = found.filter((o) => o.unknown);
    return {
      ...base,
      result: RESULT.skipped,
      disposition: DISPOSITION.notEvaluated,
      message: reasons[0]?.message ?? "A check for this rule could not run, so no violation can be ruled out.",
      evidence: reasons.flatMap((o) => o.evidence ?? []),
    };
  }

  const evidence = found.flatMap((o) => o.evidence ?? []);

  if (rule.assurance === "partial") {
    // Ran, found nothing, and by its own declaration covered less than the rule requires. Standard 5
    // R6: skipped / not-evaluated, never passed. The distinction is left to distinction(), so a
    // forbidden rule surfaces as prohibited-but-unestablished. The detector's own message and
    // evidence are kept, because what WAS searched is still worth reading.
    const within = found[0]?.message;
    return {
      ...base,
      result: RESULT.skipped,
      disposition: DISPOSITION.notEvaluated,
      message:
        "Not established. The check ran over a declared partial scope and found nothing within it; " +
        "this rule's assurance is partial, so what lies outside that scope was not examined." +
        (within ? ` Within the searched scope: ${within}` : ""),
      evidence,
    };
  }

  return {
    ...base,
    result: RESULT.passed,
    disposition: DISPOSITION.evaluated,
    message: found[0]?.message ?? "No violation found by the stated search.",
    evidence,
  };
}

/**
 * Produce the verdict.
 *
 * @param {object} args
 * @param {Map} args.resolved            rule id -> policy resolution (from applyPolicy)
 * @param {Array} args.observations      detector observations, each bound to a rule id
 * @param {string[]} args.evaluatedRules the explicit list of rules any detector examines
 * @param {Array} args.invariantViolations structural integrity breaches
 */
export function evaluate({ resolved, observations, evaluatedRules, invariantViolations = [] }) {
  const results = [];
  for (const entry of resolved.values()) {
    const outcome = evaluateRule(entry, observations, evaluatedRules);
    results.push({ ...outcome, distinction: distinction(outcome.result, outcome.disposition, outcome.level) });
  }

  results.sort((a, b) => a.rule.localeCompare(b.rule));

  const applicable = results.filter((r) => r.disposition !== DISPOSITION.notApplicable);
  const passed = results.filter((r) => r.result === RESULT.passed);
  const failed = results.filter((r) => r.result === RESULT.failed);
  const warnings = results.filter((r) => r.result === RESULT.warning);
  const skipped = results.filter((r) => r.result === RESULT.skipped);

  const unestablishedProhibitions = results
    .filter((r) => r.distinction === DISTINCTION.prohibitedButUnestablished)
    .map((r) => ({
      rule: r.rule,
      standardRef: r.standardRef,
      reason: r.message,
    }));

  const notEvaluable = results
    .filter((r) => r.validationType === "not-evaluable")
    .map((r) => ({ rule: r.rule, standardRef: r.standardRef, note: r.message }));

  // Rules that are unestablished for any reason — not only prohibitions. Any of these caps the
  // verdict, because a project cannot be called compliant with a rule nobody examined.
  const unestablished = applicable.filter(
    (r) => r.disposition === DISPOSITION.notEvaluated && r.validationType !== "not-evaluable",
  );

  const requiredFailures = failed.filter((r) => r.level === "required" || r.level === "forbidden");

  let status;
  if (invariantViolations.length > 0) {
    status = STATUS.BLOCKED_BY_INVARIANT;
  } else if (requiredFailures.length > 0) {
    status = STATUS.NON_COMPLIANT;
  } else if (unestablished.length > 0) {
    status = STATUS.NOT_EVALUATED;
  } else {
    status = STATUS.COMPLIANT;
  }

  // Scored rules exclude not-applicable and not-evaluable. A not-evaluable rule sits outside the
  // denominator in BOTH directions: admitting a blind spot must not look like a compliance failure
  // any more than it may look like an improvement.
  const scored = applicable.filter((r) => r.validationType !== "not-evaluable");
  const scoredPassed = scored.filter((r) => r.result === RESULT.passed).length;

  const score =
    status === STATUS.BLOCKED_BY_INVARIANT
      ? null
      : scored.length === 0
        ? null
        : Math.round((scoredPassed / scored.length) * 100);

  return {
    status,
    score,
    summary: {
      passed: passed.length,
      failed: failed.length,
      warnings: warnings.length,
      skipped: skipped.length,
    },
    assurance: {
      automated: results.filter(
        (r) => r.disposition === DISPOSITION.evaluated && r.validationType !== "manual-review",
      ).length,
      manualReview: results.filter((r) => r.validationType === "manual-review").length,
      notEvaluated: results.filter((r) => r.disposition === DISPOSITION.notEvaluated).length,
    },
    denominator: {
      total: results.length,
      applicable: applicable.length,
      scored: scored.length,
      basis: "applicable rules, excluding not-evaluable ones, which sit outside the score in both directions",
    },
    notEvaluable,
    unestablishedProhibitions,
    invariantViolations,
    results,
  };
}

/** Wrap a verdict in the envelope a consumer reads. */
export function envelope({ verdict, project, standardVersion, frameworkVersion, policyPath, policySource, auditedAt, frameworkCoverage }) {
  return {
    schemaVersion: "1.0",
    standard: { id: "ai", version: frameworkVersion },
    standardVersion: standardVersion ?? null,
    project: project ?? null,
    policyPath,
    policySource,
    status: verdict.status,
    score: verdict.score,
    summary: verdict.summary,
    assurance: verdict.assurance,
    denominator: verdict.denominator,
    // Coverage travels BESIDE the verdict, never inside it.
    frameworkCoverage,
    notEvaluable: verdict.notEvaluable,
    unestablishedProhibitions: verdict.unestablishedProhibitions,
    invariantViolations: verdict.invariantViolations,
    auditedAt,
    results: verdict.results,
  };
}
