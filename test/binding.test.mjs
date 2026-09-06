// The drift guard between EVALUATED_RULES and what the detectors actually report on.
//
// This is checked in BOTH directions. A rule in the list with no detector would be reported as
// passed-by-omission the moment a project adopts it; a detector reporting on a rule outside the
// list would produce a finding the evaluator ignores. Either direction is a silent divergence
// between what the tool claims to examine and what it examines.

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCatalog, assertBindings, CatalogError, coverage } from "../scripts/catalog.mjs";
import { EVALUATED_RULES } from "../scripts/standards.mjs";
import { validate, fixture } from "./helpers.mjs";

const catalog = loadCatalog();

test("every rule in EVALUATED_RULES exists in the catalog", () => {
  for (const id of EVALUATED_RULES) {
    assert.ok(catalog.rules.has(id), `EVALUATED_RULES names ${id}, which the catalog does not define`);
  }
});

test("EVALUATED_RULES has no duplicates", () => {
  assert.equal(new Set(EVALUATED_RULES).size, EVALUATED_RULES.length);
});

// The fixtures below are chosen to make every detector fire at least once, so the union of rules
// the detectors report on is complete. A detector that never runs would otherwise look consistent.
const EXERCISING = [
  "valid-manifest", "no-manifest", "invalid-manifest", "scaffold-manifest",
  "floating-model-alias", "pinned-model", "inline-system-prompt", "file-backed-prompt",
  "disabled-safety", "safety-configured", "undeclared-tool", "declared-tools",
  "no-tool-permissions", "mentions-only",
];

function reportedRules() {
  const seen = new Set();
  for (const name of EXERCISING) {
    const { json } = validate(fixture(name));
    assert.ok(json, `${name} must produce an envelope`);
    for (const result of json.results) {
      if (result.disposition === "evaluated") seen.add(result.rule);
    }
  }
  return seen;
}

test("every rule the detectors evaluate is in EVALUATED_RULES", () => {
  for (const id of reportedRules()) {
    assert.ok(
      EVALUATED_RULES.includes(id),
      `a detector evaluated ${id}, which is not in EVALUATED_RULES — the evaluator would ignore it`,
    );
  }
});

test("every rule in EVALUATED_RULES is actually evaluated by some detector", () => {
  const seen = reportedRules();
  const inert = EVALUATED_RULES.filter((id) => !seen.has(id));
  assert.deepEqual(
    inert,
    [],
    "these rules claim a detector but none of the exercising fixtures produced an evaluated result " +
    "for them. A rule listed here with no detector passes by omission.",
  );
});

test("mutation: adding an id to EVALUATED_RULES with no detector is detectable", () => {
  // This proves the previous test can fail. Simulated rather than by editing the constant,
  // because the constant is imported at module load.
  const seen = reportedRules();
  const withPhantom = [...EVALUATED_RULES, "privacy.retention-declared"];
  const inert = withPhantom.filter((id) => !seen.has(id));
  assert.deepEqual(
    inert,
    ["privacy.retention-declared"],
    "the drift check must notice a rule that claims a detector and has none",
  );
});

test("assertBindings refuses a rule id the catalog does not define", () => {
  assert.throws(
    () => assertBindings(catalog, ["lifecycle.manifest-exists", "made.up-rule"]),
    (err) => {
      assert.ok(err instanceof CatalogError);
      assert.match(err.message, /made\.up-rule/);
      return true;
    },
  );
});

test("assertBindings accepts real ids and ignores nulls, so descriptive findings pass through", () => {
  assert.doesNotThrow(() => assertBindings(catalog, ["lifecycle.manifest-exists", null]));
});

test("coverage counts every rule exactly once across its four buckets", () => {
  const c = coverage(catalog, EVALUATED_RULES);
  assert.equal(
    c.evaluated + c.manualReview + c.notEvaluable + c.unimplemented,
    c.total,
    "coverage buckets must partition the catalog",
  );
  assert.equal(c.total, catalog.rules.size);
});
