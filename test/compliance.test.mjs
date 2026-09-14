// Aggregation: the decision order, the truth table, and the rules that keep unknown from passing.

import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, envelope, STATUS, RESULT, DISPOSITION, DISTINCTION } from "../scripts/compliance.mjs";
import { loadCatalog, resolve } from "../scripts/catalog.mjs";
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

// --- Q13: partial assurance. Standard 5 R6 ------------------------------------------------------
//
// R6: a check that "covered less than the rule requires" MUST report skipped / not-evaluated and
// MUST NOT report passed. A rule declaring `assurance: partial` covers less than the rule by its own
// declaration. These tests use the catalog's own rule objects, so the real ids, levels and
// severities are exercised rather than a stand-in.

const CATALOG = loadCatalog();
const Q13_PARTIAL_RULES = [
  "lifecycle.model-version-pinned",
  "misuse.safety-controls-not-disabled",
  "promptsec.no-inline-system-prompt",
  "promptsec.prompt-is-versioned-artifact",
];
const FULL_RULES = [
  "gate.actions-classified",
  "gate.tool-permission-manifest",
  "lifecycle.manifest-exists",
  "lifecycle.manifest-not-scaffold",
  "lifecycle.manifest-valid",
];

function catalogEntry(id, over = {}) {
  const rule = resolve(CATALOG, id);
  assert.ok(rule, `${id} must exist in the catalog`);
  return {
    rule,
    level: over.level ?? rule.level,
    undeclared: false,
    applicable: over.applicable ?? true,
    applicabilityReason: over.reason ?? null,
  };
}

const resolvedFrom = (...entries) => new Map(entries.map((e) => [e.rule.id, e]));
const cleanObs = (rule, evidence = []) => ({ rule, message: `clean within scope for ${rule}`, evidence });
const unestablishedAs = (level) =>
  level === "forbidden" ? DISTINCTION.prohibitedButUnestablished : DISTINCTION.notEvaluated;

test("Q13: the catalog's partial-assurance rules are exactly the four these tests name", () => {
  const partial = [...CATALOG.rules.values()].filter((r) => r.assurance === "partial").map((r) => r.id);
  assert.deepEqual(
    [...new Set(partial)].sort(),
    Q13_PARTIAL_RULES,
    "a new partial rule must be added here so its clean result is tested as unestablished",
  );
  for (const id of FULL_RULES) assert.equal(resolve(CATALOG, id).assurance, "full", `${id} is the full-assurance control`);
});

for (const id of Q13_PARTIAL_RULES) {
  test(`Q13: ${id} clean at its catalog level is skipped / not-evaluated, never passed`, () => {
    const entry = catalogEntry(id);
    const v = evaluate({ resolved: resolvedFrom(entry), observations: [cleanObs(id, ["seen.yml"])], evaluatedRules: [id] });
    const r = v.results[0];
    assert.equal(r.assurance, "partial");
    assert.equal(r.result, RESULT.skipped);
    assert.equal(r.disposition, DISPOSITION.notEvaluated);
    assert.equal(r.distinction, unestablishedAs(entry.level));
    assert.match(r.message, /declared partial scope and found nothing within it/);
    assert.doesNotMatch(r.message, /\bpass(ed|es)?\b/i, "the message must not read as a pass");
    assert.ok(r.message.includes(`clean within scope for ${id}`), "the detector's own message is kept");
    assert.deepEqual(r.evidence, ["seen.yml"], "evidence the detector recorded is kept");
    assert.equal(v.status, STATUS.NOT_EVALUATED);
    assert.equal(v.score, 0, "a partial clean result is not in the numerator");
    assert.deepEqual(v.summary, { passed: 0, failed: 0, warnings: 0, skipped: 1 });
    assert.equal(v.assurance.automated, 0);
    assert.equal(v.assurance.notEvaluated, 1);
    assert.equal(
      v.unestablishedProhibitions.some((p) => p.rule === id),
      entry.level === "forbidden",
      "the array lists the rule exactly when it is forbidden",
    );
  });

  for (const level of ["required", "recommended", "forbidden"]) {
    test(`Q13: ${id} at level ${level} — clean is unestablished, a confirmed violation still stands`, () => {
      const entry = catalogEntry(id, { level });

      const clean = evaluate({ resolved: resolvedFrom(entry), observations: [cleanObs(id)], evaluatedRules: [id] });
      assert.equal(clean.results[0].result, RESULT.skipped);
      assert.equal(clean.results[0].disposition, DISPOSITION.notEvaluated);
      assert.equal(clean.results[0].distinction, unestablishedAs(level));

      const bad = evaluate({
        resolved: resolvedFrom(entry),
        observations: [{ rule: id, violation: true, message: "confirmed", evidence: ["bad.js"] }],
        evaluatedRules: [id],
      });
      const r = bad.results[0];
      const expected = level === "recommended" || entry.rule.severity === "warning" ? RESULT.warning : RESULT.failed;
      assert.equal(r.result, expected, "partial assurance must never erase a valid finding");
      assert.equal(r.disposition, DISPOSITION.evaluated);
      assert.equal(r.distinction, expected);
      assert.equal(r.message, "confirmed");
      assert.deepEqual(r.evidence, ["bad.js"]);
      assert.equal(bad.status, expected === RESULT.failed ? STATUS.NON_COMPLIANT : STATUS.COMPLIANT);
      assert.deepEqual(bad.unestablishedProhibitions, []);
    });
  }
}

test("Q13: violation beats partial — a confirmed finding plus an unknown carries only the finding", () => {
  const id = "misuse.safety-controls-not-disabled";
  const v = evaluate({
    resolved: resolvedFrom(catalogEntry(id)),
    observations: [
      cleanObs(id, ["clean.yml"]),
      { rule: id, violation: true, message: "confirmed", evidence: ["real.yml"] },
      { rule: id, unknown: true, message: "could not run", evidence: ["unknown.yml"] },
    ],
    evaluatedRules: [id],
  });
  assert.equal(v.results[0].result, RESULT.failed);
  assert.deepEqual(v.results[0].evidence, ["real.yml"]);
  assert.equal(v.status, STATUS.NON_COMPLIANT);
});

test("Q13: unknown beats partial — an unknown keeps its own reason, not the partial-scope message", () => {
  for (const id of Q13_PARTIAL_RULES) {
    const reason = "The walk was shortened by a framework exclusion, so absence cannot be established.";
    const v = evaluate({
      resolved: resolvedFrom(catalogEntry(id)),
      observations: [cleanObs(id, ["clean.yml"]), { rule: id, unknown: true, message: reason, evidence: ["test/fixtures"] }],
      evaluatedRules: [id],
    });
    const r = v.results[0];
    assert.equal(r.result, RESULT.skipped);
    assert.equal(r.disposition, DISPOSITION.notEvaluated);
    assert.equal(r.message, reason, `${id}: the unknown's own reason must be carried`);
    assert.doesNotMatch(r.message, /declared partial scope/);
    assert.deepEqual(r.evidence, ["test/fixtures"], "only the unknown's evidence is carried");
  }
});

test("Q13: not-applicable beats partial, and does not cap the status", () => {
  const v = evaluate({
    resolved: resolvedFrom(
      catalogEntry("lifecycle.manifest-exists"),
      ...Q13_PARTIAL_RULES.map((id) => catalogEntry(id, { applicable: false, reason: "no subject here" })),
    ),
    observations: [cleanObs("lifecycle.manifest-exists"), ...Q13_PARTIAL_RULES.map((id) => cleanObs(id))],
    evaluatedRules: ["lifecycle.manifest-exists", ...Q13_PARTIAL_RULES],
  });
  for (const id of Q13_PARTIAL_RULES) {
    const r = v.results.find((x) => x.rule === id);
    assert.equal(r.disposition, DISPOSITION.notApplicable);
    assert.equal(r.distinction, DISTINCTION.skipped);
    assert.match(r.message, /^Declared not applicable: no subject here/);
  }
  assert.equal(v.status, STATUS.COMPLIANT);
  assert.equal(v.score, 100);
  assert.deepEqual(v.unestablishedProhibitions, []);
});

test("Q13: an invariant breach still blocks, with a null score, when partial rules are clean", () => {
  const v = evaluate({
    resolved: resolvedFrom(catalogEntry("lifecycle.manifest-exists"), catalogEntry("misuse.safety-controls-not-disabled")),
    observations: [cleanObs("lifecycle.manifest-exists"), cleanObs("misuse.safety-controls-not-disabled")],
    evaluatedRules: ["lifecycle.manifest-exists", "misuse.safety-controls-not-disabled"],
    invariantViolations: [{ id: "invariant.probe", message: "broken", evidence: [] }],
  });
  assert.equal(v.status, STATUS.BLOCKED_BY_INVARIANT);
  assert.equal(v.score, null);
  assert.equal(v.results.find((r) => r.rule === "misuse.safety-controls-not-disabled").result, RESULT.skipped);
});

test("Q13: a not-evaluable rule still changes neither status nor score beside a partial rule", () => {
  const notEvaluable = {
    rule: { id: "c.unknowable", standard: 1, severity: "error", assurance: "none", validationType: "not-evaluable", remediation: null, $notEvaluableNote: "n" },
    level: "required",
    undeclared: false,
    applicable: true,
    applicabilityReason: null,
  };
  const base = [catalogEntry("lifecycle.manifest-exists"), catalogEntry("lifecycle.model-version-pinned")];
  const args = {
    observations: [cleanObs("lifecycle.manifest-exists"), cleanObs("lifecycle.model-version-pinned")],
    evaluatedRules: ["lifecycle.manifest-exists", "lifecycle.model-version-pinned"],
  };
  const withNE = evaluate({ ...args, resolved: resolvedFrom(...base, notEvaluable) });
  const withoutNE = evaluate({ ...args, resolved: resolvedFrom(...base) });
  assert.equal(withNE.status, withoutNE.status);
  assert.equal(withNE.score, withoutNE.score);
  assert.equal(withNE.denominator.scored, withoutNE.denominator.scored);
  assert.match(withNE.results.find((r) => r.rule === "c.unknowable").message, /^Not evaluable by this framework\./);
});

test("Q13: a partial rule outside evaluatedRules keeps the no-detector message", () => {
  const id = "promptsec.prompt-is-versioned-artifact";
  const v = evaluate({ resolved: resolvedFrom(catalogEntry(id)), observations: [], evaluatedRules: [] });
  assert.equal(v.results[0].disposition, DISPOSITION.notEvaluated);
  assert.equal(v.results[0].message, "No detector in this release examines this rule.");
});

test("Q13 scoring: the numerator excludes a partial clean result; a full clean result still counts", () => {
  const full = "lifecycle.manifest-exists";
  const partial = "lifecycle.model-version-pinned";
  const v = evaluate({
    resolved: resolvedFrom(catalogEntry(full), catalogEntry(partial)),
    observations: [cleanObs(full), cleanObs(partial)],
    evaluatedRules: [full, partial],
  });
  const f = v.results.find((r) => r.rule === full);
  assert.equal(f.result, RESULT.passed, "full assurance, clean: still passed");
  assert.equal(f.disposition, DISPOSITION.evaluated);
  assert.equal(v.results.find((r) => r.rule === partial).result, RESULT.skipped);
  assert.equal(v.status, STATUS.NOT_EVALUATED);
  assert.equal(v.score, 50, "denominator 2 (both applicable and scored), numerator 1");
  assert.deepEqual(v.summary, { passed: 1, failed: 0, warnings: 0, skipped: 1 });
  assert.deepEqual(v.assurance, { automated: 1, manualReview: 0, notEvaluated: 1 });
  assert.equal(v.denominator.total, 2);
  assert.equal(v.denominator.applicable, 2);
  assert.equal(v.denominator.scored, 2);
});

test("Q13 negative control: COMPLIANT is still reachable when only full-assurance rules apply", () => {
  const v = evaluate({
    resolved: resolvedFrom(...FULL_RULES.map((id) => catalogEntry(id))),
    observations: FULL_RULES.map((id) => cleanObs(id)),
    evaluatedRules: FULL_RULES,
  });
  assert.equal(v.status, STATUS.COMPLIANT);
  assert.equal(v.score, 100);
  for (const r of v.results) assert.equal(r.result, RESULT.passed, `${r.rule} must pass`);
});

test("Q13 decision order: a required failure still outranks an unestablished partial rule", () => {
  const v = evaluate({
    resolved: resolvedFrom(catalogEntry("lifecycle.manifest-exists"), catalogEntry("misuse.safety-controls-not-disabled")),
    observations: [
      { rule: "lifecycle.manifest-exists", violation: true, message: "x" },
      cleanObs("misuse.safety-controls-not-disabled"),
    ],
    evaluatedRules: ["lifecycle.manifest-exists", "misuse.safety-controls-not-disabled"],
  });
  assert.equal(v.status, STATUS.NON_COMPLIANT);
  assert.equal(v.score, 0);
  assert.equal(v.unestablishedProhibitions.length, 1);
});
