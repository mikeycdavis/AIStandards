// Q13 through the CLI: a partial-assurance clean result is not a pass, end to end.
//
// Standard 5 R6: where a check "covered less than the rule requires", the result MUST be skipped /
// not-evaluated and MUST NOT be passed. Four rules declare `assurance: partial`. Before this change a
// clean narrow search from any of them reported `passed` and counted toward COMPLIANT and the score:
// a repository with no provider configuration at all, and one whose `.env` sets BLOCK_NONE in a file
// type the detector does not read, each reported COMPLIANT with score 100.
//
// The q13-synthetic-* fixtures are SYNTHETIC TEST INPUTS. Their not-applicable declarations exist
// only to isolate the verdict path of the evaluated rules and are not real applicability approvals.
// This file does not assert that the detector cannot see `.env`: pinning a blind spot as intended
// behaviour is exactly what the old controls did. It asserts only that the blind spot is not a pass.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { validate, fixture, HERE, REPO, resultFor } from "./helpers.mjs";
import { validate as validateSchema } from "../scripts/jsonschema.mjs";
import { loadCatalog } from "../scripts/catalog.mjs";
import { EVALUATED_RULES } from "../scripts/standards.mjs";

const SCHEMA = JSON.parse(fs.readFileSync(path.join(REPO, "schemas", "validate-report.schema.json"), "utf8"));
const CATALOG = loadCatalog();
const assuranceOf = (id) => CATALOG.rules.get(id).assurance;
const PARTIAL_EVALUATED = EVALUATED_RULES.filter((id) => assuranceOf(id) === "partial").sort();
const FULL_EVALUATED = EVALUATED_RULES.filter((id) => assuranceOf(id) === "full").sort();
const SAFETY = "misuse.safety-controls-not-disabled";

const REPRODUCTIONS = ["q13-synthetic-no-config", "q13-synthetic-env-block-none"];
const CONTROL = "q13-synthetic-full-only";

test("every evaluated rule declares full or partial assurance", () => {
  // A rule with a detector and `assurance: none` would raise Q13's question again, and the
  // aggregation handles only `partial`. If one appears, this fails and the case has to be decided.
  for (const id of EVALUATED_RULES) {
    assert.ok(["full", "partial"].includes(assuranceOf(id)), `${id} declares assurance ${assuranceOf(id)}`);
  }
  assert.equal(PARTIAL_EVALUATED.length, 4);
  assert.equal(FULL_EVALUATED.length, 5);
});

test("the q13 fixtures are labelled synthetic, and so is every not-applicable declaration", () => {
  for (const name of [...REPRODUCTIONS, CONTROL]) {
    const text = fs.readFileSync(path.join(fixture(name), "ai-policy.yml"), "utf8");
    assert.match(text, /^# SYNTHETIC TEST INPUT\./, `${name}: the header must say it is synthetic`);
    assert.match(text, /not real applicability approvals/);
    const declarations = text.match(/status: not-applicable/g) ?? [];
    const labelled = text.match(/reason: "SYNTHETIC TEST INPUT: [^"]*not a real applicability approval\."/g) ?? [];
    assert.ok(declarations.length > 0, `${name} must declare something not-applicable`);
    assert.equal(labelled.length, declarations.length, `${name}: every not-applicable reason must be labelled synthetic`);
  }
});

for (const name of REPRODUCTIONS) {
  test(`Q13 reproduction ${name}: NOT_EVALUATED, not COMPLIANT, and no partial rule passed`, () => {
    const { json, code } = validate(fixture(name));
    assert.ok(json, `${name} must produce an envelope`);
    assert.deepEqual(validateSchema(json, SCHEMA), [], `${name} envelope must validate against the schema`);

    assert.notEqual(json.status, "COMPLIANT", "a repository this detector cannot see into must not be certified");
    assert.equal(json.status, "NOT_EVALUATED");
    assert.equal(code, 1, "NOT_EVALUATED exits 1");
    assert.notEqual(json.score, 100);
    assert.equal(json.denominator.scored, FULL_EVALUATED.length + PARTIAL_EVALUATED.length);
    assert.equal(json.summary.passed, FULL_EVALUATED.length);
    assert.equal(json.score, Math.round((FULL_EVALUATED.length / json.denominator.scored) * 100));

    const applicablePartial = json.results.filter((r) => r.assurance === "partial" && r.disposition !== "not-applicable");
    assert.deepEqual(applicablePartial.map((r) => r.rule).sort(), PARTIAL_EVALUATED, "all four partial rules apply here");
    for (const r of applicablePartial) {
      assert.notEqual(r.result, "passed", `${r.rule} must not pass: ${r.message}`);
      assert.equal(r.disposition, "not-evaluated");
    }

    const safety = resultFor(json, SAFETY);
    assert.equal(safety.distinction, "prohibited-but-unestablished");
    const listed = json.unestablishedProhibitions.find((p) => p.rule === SAFETY);
    assert.ok(listed, `${SAFETY} must be listed in unestablishedProhibitions`);
    assert.match(listed.reason, /declared partial scope/);

    assert.deepEqual(
      json.results.filter((r) => r.result === "failed" || r.result === "warning").map((r) => r.rule),
      [],
      "no false failure: nothing was confirmed",
    );
    assert.deepEqual(json.invariantViolations, []);

    for (const id of FULL_EVALUATED) {
      assert.equal(resultFor(json, id).result, "passed", `${id} is full assurance and clean, so it still passes`);
    }
  });
}

test(`positive control ${CONTROL}: only full-assurance rules apply, and the verdict is COMPLIANT at 100`, () => {
  // Proves the fix does not work by making everything unevaluated.
  const { json, code } = validate(fixture(CONTROL));
  assert.ok(json, `${CONTROL} must produce an envelope`);
  assert.deepEqual(validateSchema(json, SCHEMA), []);
  assert.equal(json.status, "COMPLIANT");
  assert.equal(json.score, 100);
  assert.equal(code, 0);
  for (const id of FULL_EVALUATED) {
    const r = resultFor(json, id);
    assert.equal(r.result, "passed", `${id}: ${r.message}`);
    assert.equal(r.distinction, "passed");
  }
  for (const id of PARTIAL_EVALUATED) {
    assert.equal(resultFor(json, id).disposition, "not-applicable");
  }
});

test("property: across every fixture that yields an envelope, no partial-assurance result is passed", () => {
  const dirs = fs
    .readdirSync(path.join(HERE, "fixtures"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  let envelopes = 0;
  let partialApplicable = 0;
  for (const name of dirs) {
    const { json } = validate(fixture(name));
    if (!json || !Array.isArray(json.results)) continue;
    envelopes += 1;
    for (const r of json.results) {
      if (r.assurance !== "partial") continue;
      if (r.disposition !== "not-applicable") partialApplicable += 1;
      assert.notEqual(r.result, "passed", `${name}: ${r.rule} is partial assurance and reported passed: ${r.message}`);
    }
  }
  assert.ok(envelopes >= 20, `only ${envelopes} fixtures produced an envelope; the property is barely exercised`);
  assert.ok(partialApplicable > 0, "no applicable partial-assurance result was seen, so the property is vacuous");
});
