// Aggregation: the decision order, the truth table, and the rules that keep unknown from passing.

import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, envelope, STATUS, RESULT, DISPOSITION } from "../scripts/compliance.mjs";
import { validate, fixture, resultFor } from "./helpers.mjs";

// A minimal resolved-policy map, so the decision order can be tested without a fixture for each case.
function resolvedOf(entries) {
  const map = new Map();
  for (const [id, over] of Object.entries(entries)) {
    map.set(id, {
      rule: {
        id,
        standard: 1,
        severity: over.severity ?? "error",
        assurance: "full",
        validationType: over.validationType ?? "structural",
        remediation: null,
        $notEvaluableNote: over.$notEvaluableNote,
      },
      level: over.level ?? "required",
      undeclared: false,
      applicable: over.applicable ?? true,
      applicabilityReason: over.reason ?? null,
    });
  }
  return map;
}

const EVALUATED = ["a.one", "a.two"];

test("no violation and everything known -> passed", () => {
  const v = evaluate({
    resolved: resolvedOf({ "a.one": {} }),
    observations: [{ rule: "a.one", message: "clean" }],
    evaluatedRules: EVALUATED,
  });
  assert.equal(v.results[0].result, RESULT.passed);
  assert.equal(v.status, STATUS.COMPLIANT);
});

test("no violation and an unknown check -> not-evaluated, NEVER passed", () => {
  const v = evaluate({
    resolved: resolvedOf({ "a.one": {} }),
    observations: [{ rule: "a.one", unknown: true, message: "could not run" }],
    evaluatedRules: EVALUATED,
  });
  assert.equal(v.results[0].result, RESULT.skipped);
  assert.equal(v.results[0].disposition, DISPOSITION.notEvaluated);
  assert.equal(v.status, STATUS.NOT_EVALUATED, "an unestablished rule caps the status");
});

test("a confirmed violation plus an unknown check -> failed, carrying ONLY the confirmed finding", () => {
  const v = evaluate({
    resolved: resolvedOf({ "a.one": {} }),
    observations: [
      { rule: "a.one", violation: true, message: "confirmed", evidence: ["real.js"] },
      { rule: "a.one", unknown: true, message: "could not run", evidence: ["unknown.js"] },
    ],
    evaluatedRules: EVALUATED,
  });
  assert.equal(v.results[0].result, RESULT.failed);
  assert.deepEqual(
    v.results[0].evidence,
    ["real.js"],
    "the report must never present an unknown as the evidence for a failure",
  );
});

test("a rule outside evaluatedRules is not-evaluated, never passed by omission", () => {
  const v = evaluate({
    resolved: resolvedOf({ "b.unwatched": {} }),
    observations: [],
    evaluatedRules: EVALUATED,
  });
  assert.equal(v.results[0].result, RESULT.skipped);
  assert.equal(v.results[0].disposition, DISPOSITION.notEvaluated);
});

test("a recommended-level violation is a warning, not a failure", () => {
  const v = evaluate({
    resolved: resolvedOf({ "a.one": { level: "recommended", severity: "warning" } }),
    observations: [{ rule: "a.one", violation: true, message: "x" }],
    evaluatedRules: EVALUATED,
  });
  assert.equal(v.results[0].result, RESULT.warning);
  assert.equal(v.status, STATUS.COMPLIANT, "a warning alone does not make a project non-compliant");
});

test("decision order: an invariant breach outranks a required failure", () => {
  const v = evaluate({
    resolved: resolvedOf({ "a.one": {} }),
    observations: [{ rule: "a.one", violation: true, message: "x" }],
    evaluatedRules: EVALUATED,
    invariantViolations: [{ id: "invariant.probe", message: "broken", evidence: [] }],
  });
  assert.equal(v.status, STATUS.BLOCKED_BY_INVARIANT);
  assert.equal(v.score, null, "a percentage beside a blocked status undercuts the status");
});

test("decision order: a required failure outranks an unestablished rule", () => {
  const v = evaluate({
    resolved: resolvedOf({ "a.one": {}, "b.unwatched": {} }),
    observations: [{ rule: "a.one", violation: true, message: "x" }],
    evaluatedRules: EVALUATED,
  });
  assert.equal(v.status, STATUS.NON_COMPLIANT);
});

test("a not-applicable rule does not cap the status", () => {
  const v = evaluate({
    resolved: resolvedOf({
      "a.one": {},
      "b.unwatched": { applicable: false, reason: "no subject here" },
    }),
    observations: [{ rule: "a.one", message: "clean" }],
    evaluatedRules: EVALUATED,
  });
  assert.equal(v.status, STATUS.COMPLIANT, "a rule with no subject here is not an open question");
  assert.equal(v.results.find((r) => r.rule === "b.unwatched").disposition, DISPOSITION.notApplicable);
});

test("a not-evaluable rule changes neither the status nor the score", () => {
  const withNE = evaluate({
    resolved: resolvedOf({
      "a.one": {},
      "c.unknowable": { validationType: "not-evaluable", $notEvaluableNote: "n" },
    }),
    observations: [{ rule: "a.one", message: "clean" }],
    evaluatedRules: EVALUATED,
  });
  const withoutNE = evaluate({
    resolved: resolvedOf({ "a.one": {} }),
    observations: [{ rule: "a.one", message: "clean" }],
    evaluatedRules: EVALUATED,
  });
  assert.equal(withNE.status, withoutNE.status);
  assert.equal(withNE.score, withoutNE.score, "admitting a blind spot must not move the score");
  assert.equal(withNE.status, STATUS.COMPLIANT);
});

test("mutation: removing the not-evaluable exclusion WOULD change the score", () => {
  // Proves the previous test is not vacuous. If not-evaluable rules were scored, the score would
  // fall from 100 to 50 for the same project.
  const v = evaluate({
    resolved: resolvedOf({
      "a.one": {},
      "c.unknowable": { validationType: "not-evaluable", $notEvaluableNote: "n" },
    }),
    observations: [{ rule: "a.one", message: "clean" }],
    evaluatedRules: EVALUATED,
  });
  const naiveScore = Math.round((1 / 2) * 100);
  assert.notEqual(v.score, naiveScore, "the exclusion must actually be doing something");
  assert.equal(v.score, 100);
});

test("frameworkCoverage travels beside the verdict, never inside it", () => {
  const { json } = validate(fixture("valid-manifest"));
  assert.ok(json.frameworkCoverage, "coverage must be reported");
  assert.ok(!("frameworkCoverage" in json.summary), "coverage must not be part of the summary");
  assert.ok(
    json.denominator.scored <= json.denominator.applicable,
    "coverage must not inflate the scored denominator",
  );
});

test("the envelope is stable in shape for a clean and a failing run alike", () => {
  const clean = validate(fixture("declared-tools")).json;
  const failing = validate(fixture("no-manifest")).json;
  assert.deepEqual(
    Object.keys(clean).sort(),
    Object.keys(failing).sort(),
    "a consumer must not have to branch on status to find a field",
  );
});

test("a real fixture reaches NON_COMPLIANT with a real failure, not an inferred one", () => {
  const { json } = validate(fixture("no-manifest"));
  assert.equal(json.status, STATUS.NON_COMPLIANT);
  const r = resultFor(json, "lifecycle.manifest-exists");
  assert.equal(r.result, RESULT.failed);
  assert.match(r.message, /No AI system manifest found/);
});
