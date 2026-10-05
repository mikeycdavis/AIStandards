// The six-way distinction.
//
// The brief requires six distinguishable outcomes. Two things must hold: all six must be reachable
// (or the vocabulary is decorative), and the value must be DERIVED — recomputed here independently
// and compared, so it cannot drift from the vocabularies it summarises.

import { test } from "node:test";
import assert from "node:assert/strict";
import { distinction, RESULT, DISPOSITION, DISTINCTION } from "../scripts/compliance.mjs";
import { validate, fixture, distinctionsIn } from "./helpers.mjs";

// An independent reimplementation. If this and compliance.mjs ever disagree, one of them changed
// without the other, which is exactly what this test exists to catch.
function expectedDistinction(result, disposition, level) {
  if (result === "passed") return "passed";
  if (result === "failed") return "failed";
  if (result === "warning") return "warning";
  if (disposition === "not-evaluated") {
    return level === "forbidden" ? "prohibited-but-unestablished" : "not-evaluated";
  }
  return "skipped";
}

const FIXTURES = [
  "valid-manifest", "no-manifest", "invalid-manifest", "scaffold-manifest",
  "floating-model-alias", "pinned-model", "inline-system-prompt", "file-backed-prompt",
  "disabled-safety", "safety-configured", "undeclared-tool", "declared-tools",
  "no-tool-permissions", "mentions-only", "not-applicable", "applicability-contradiction",
];

test("distinction is a pure function of (result, disposition, level), across every fixture", () => {
  let checked = 0;
  for (const name of FIXTURES) {
    const { json } = validate(fixture(name));
    assert.ok(json, `${name} must produce an envelope`);
    for (const r of json.results) {
      assert.equal(
        r.distinction,
        expectedDistinction(r.result, r.disposition, r.level),
        `${name}: ${r.rule} distinction disagrees with an independent recomputation`,
      );
      checked += 1;
    }
  }
  assert.ok(checked > 100, `only ${checked} results checked; the fixtures are not exercising much`);
});

test("all six distinction values are reachable across the fixtures", () => {
  const seen = new Set();
  for (const name of FIXTURES) {
    const { json } = validate(fixture(name));
    for (const d of distinctionsIn(json)) seen.add(d);
  }
  for (const value of Object.values(DISTINCTION)) {
    assert.ok(seen.has(value), `no fixture produces the distinction ${value}`);
  }
});

test("a forbidden rule nobody examined is prohibited-but-unestablished, NOT not-evaluated", () => {
  // Branch order is load-bearing: a consumer scanning for unexamined prohibitions filters on this
  // value, and reporting such a rule as merely not-evaluated hides it.
  assert.equal(
    distinction(RESULT.skipped, DISPOSITION.notEvaluated, "forbidden"),
    DISTINCTION.prohibitedButUnestablished,
  );
  assert.equal(
    distinction(RESULT.skipped, DISPOSITION.notEvaluated, "required"),
    DISTINCTION.notEvaluated,
  );
});

test("a forbidden rule that WAS examined is not reported as unestablished", () => {
  // The negative control. A derivation that returned prohibited-but-unestablished for every
  // forbidden rule would satisfy the positive test above.
  assert.equal(distinction(RESULT.passed, DISPOSITION.evaluated, "forbidden"), DISTINCTION.passed);
  assert.equal(distinction(RESULT.failed, DISPOSITION.evaluated, "forbidden"), DISTINCTION.failed);
});

test("not-applicable is skipped, never not-evaluated — they mean opposite things", () => {
  assert.equal(
    distinction(RESULT.skipped, DISPOSITION.notApplicable, "forbidden"),
    DISTINCTION.skipped,
    "a rule with no subject here is not a rule nobody looked at",
  );
});

test("the unestablishedProhibitions array and the results agree in BOTH directions", () => {
  for (const name of FIXTURES) {
    const { json } = validate(fixture(name));
    const fromResults = new Set(
      json.results
        .filter((r) => r.distinction === DISTINCTION.prohibitedButUnestablished)
        .map((r) => r.rule),
    );
    const fromArray = new Set(json.unestablishedProhibitions.map((p) => p.rule));
    assert.deepEqual(
      [...fromArray].sort(),
      [...fromResults].sort(),
      `${name}: the array and the filtered results must name the same rules`,
    );
  }
});

test("unestablishedProhibitions is always present, empty rather than absent", () => {
  const { json } = validate(fixture("declared-tools"));
  assert.ok(
    Array.isArray(json.unestablishedProhibitions),
    "a consumer must be able to distinguish 'none went unexamined' from 'this validator predates the field'",
  );
});
