// The not-evaluable floor.
//
// `not-evaluable` is the honest admission that this framework states a requirement whose subject is
// not in the repository. It is dangerous in exactly one way: it is also the easiest place to hide a
// rule nobody wanted to write a detector for. These tests make that hiding place uncomfortable.

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCatalog } from "../scripts/catalog.mjs";
import { EVALUATED_RULES } from "../scripts/standards.mjs";
import { validate, fixture } from "./helpers.mjs";

const catalog = loadCatalog();
const notEvaluable = [...catalog.rules.values()].filter((r) => r.validationType === "not-evaluable");

test("there is at least one not-evaluable rule, or this file is measuring nothing", () => {
  assert.ok(notEvaluable.length > 0);
});

test("every not-evaluable rule carries a substantive note", () => {
  for (const rule of notEvaluable) {
    assert.ok(rule.$notEvaluableNote.trim().length >= 40, `${rule.id} note is too short to say anything`);
  }
});

test("every not-evaluable note explains why human review of the REPOSITORY is also insufficient", () => {
  // This is what separates not-evaluable from manual-review. A note that only says "no detector"
  // is describing manual-review and has been misfiled.
  for (const rule of notEvaluable) {
    const note = rule.$notEvaluableNote.toLowerCase();
    const explains =
      note.includes("inference time") ||
      note.includes("behaviour") ||
      note.includes("behavior") ||
      note.includes("runtime") ||
      note.includes("not repository content") ||
      note.includes("red-team") ||
      note.includes("adversarial");
    assert.ok(
      explains,
      `${rule.id}'s note must say why the subject is outside the repository. If a human could ` +
      "establish it by reading the repository, the rule is manual-review, not not-evaluable.",
    );
  }
});

test("every not-evaluable note names what WOULD make the rule checkable", () => {
  for (const rule of notEvaluable) {
    const note = rule.$notEvaluableNote.toLowerCase();
    assert.ok(
      /artifact|exercise|record|harness|recorded/.test(note),
      `${rule.id}'s note must name the artifact that would make it evaluable, so the rule has a ` +
      "route out of not-evaluable rather than sitting there permanently.",
    );
  }
});

test("no not-evaluable rule is in EVALUATED_RULES", () => {
  for (const rule of notEvaluable) {
    assert.ok(!EVALUATED_RULES.includes(rule.id), `${rule.id} is not-evaluable and cannot be evaluated`);
  }
});

test("no not-evaluable rule is attestable, nonExemptible, or claims assurance", () => {
  for (const rule of notEvaluable) {
    assert.equal(rule.attestable, false, `${rule.id} must not be attestable`);
    assert.equal(rule.nonExemptible, false, `${rule.id} must not be nonExemptible`);
    assert.equal(rule.assurance, "none", `${rule.id} must declare assurance none`);
  }
});

test("a not-evaluable rule never reports as passed", () => {
  const { json } = validate(fixture("valid-manifest"));
  for (const rule of notEvaluable) {
    const result = json.results.find((r) => r.rule === rule.id);
    if (!result) continue;
    assert.notEqual(result.result, "passed", `${rule.id} must never pass`);
  }
});

test("not-evaluable rules appear in the notEvaluable array, and it is always present", () => {
  const { json } = validate(fixture("valid-manifest"));
  assert.ok(Array.isArray(json.notEvaluable), "the array must always be present, empty when none");
  const listed = new Set(json.notEvaluable.map((n) => n.rule));
  for (const rule of notEvaluable) {
    // Only those the policy adopts and does not declare not-applicable.
    const result = json.results.find((r) => r.rule === rule.id);
    if (result && result.disposition !== "not-applicable") {
      assert.ok(listed.has(rule.id), `${rule.id} must be listed in notEvaluable`);
    }
  }
});

test("not-evaluable rules are excluded from the scored denominator, in both directions", () => {
  const { json } = validate(fixture("valid-manifest"));
  const applicable = json.results.filter((r) => r.disposition !== "not-applicable");
  const evaluableApplicable = applicable.filter((r) => r.validationType !== "not-evaluable");
  assert.equal(
    json.denominator.scored,
    evaluableApplicable.length,
    "the score's denominator must exclude not-evaluable rules — admitting a blind spot must not " +
    "look like a compliance failure any more than it may look like an improvement",
  );
});
