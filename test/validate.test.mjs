// Validate: the envelope, its schema, the invariant path, and exit codes.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { validate, validateRaw, fixture, REPO, resultFor } from "./helpers.mjs";
import { validate as validateSchema } from "../scripts/jsonschema.mjs";

const SCHEMA = JSON.parse(
  fs.readFileSync(path.join(REPO, "schemas", "validate-report.schema.json"), "utf8"),
);

const FIXTURES = [
  "valid-manifest", "no-manifest", "invalid-manifest", "scaffold-manifest",
  "floating-model-alias", "pinned-model", "inline-system-prompt", "file-backed-prompt",
  "disabled-safety", "safety-configured", "undeclared-tool", "declared-tools",
  "no-tool-permissions", "mentions-only", "not-applicable", "applicability-contradiction",
  "policy-elsewhere",
];

test("every fixture produces an envelope that validates against the report schema", () => {
  for (const name of FIXTURES) {
    const { json } = validate(fixture(name));
    assert.ok(json, `${name} produced no envelope`);
    const problems = validateSchema(json, SCHEMA);
    assert.deepEqual(problems, [], `${name} envelope violates the schema:\n${problems.join("\n")}`);
  }
});

test("the envelope declares this pack's contract id", () => {
  const { json } = validate(fixture("valid-manifest"));
  assert.equal(json.standard.id, "ai", "the contract id follows the portfolio's repo-name derivation");
  assert.equal(json.standard.version, fs.readFileSync(path.join(REPO, "VERSION"), "utf8").trim());
});

test("BLOCKED_BY_INVARIANT: a policy contradicted by an observation blocks rather than scores", () => {
  const { json, code } = validate(fixture("applicability-contradiction"));
  assert.equal(json.status, "BLOCKED_BY_INVARIANT");
  assert.equal(json.score, null, "no percentage may sit beside a blocked status");
  assert.equal(code, 3);
  assert.equal(json.invariantViolations.length, 1);
  assert.equal(json.invariantViolations[0].id, "invariant.applicability-contradicted");
  assert.match(json.invariantViolations[0].message, /different repository/);
});

test("negative control: the same rule declared not-applicable WITHOUT a contradiction does not block", () => {
  // Without this, an invariant that fired on every not-applicable declaration would pass the test above.
  const { json, code } = validate(fixture("not-applicable"));
  assert.notEqual(json.status, "BLOCKED_BY_INVARIANT");
  assert.deepEqual(json.invariantViolations, []);
  assert.notEqual(code, 3);
  assert.equal(resultFor(json, "eval.plan-exists").disposition, "not-applicable");
});

test("exit codes: 1 for a project failure, 2 for configuration, 3 for blocked", () => {
  assert.equal(validateRaw(fixture("no-manifest"), ["--json"]).code, 1);
  assert.equal(validateRaw(fixture("policy-missing"), ["--json"]).code, 2);
  assert.equal(validateRaw(fixture("applicability-contradiction"), ["--json"]).code, 3);
});

test("NOT_EVALUATED exits 1, not 0 — an unanswered question is not a pass", () => {
  const r = validateRaw(fixture("valid-manifest"), ["--json"]);
  assert.equal(JSON.parse(r.stdout).status, "NOT_EVALUATED");
  assert.equal(r.code, 1);
});

test("an undeclared rule is still evaluated at its catalog default", () => {
  // The fixture policies omit several rules; those must appear in results, not vanish.
  const { json } = validate(fixture("valid-manifest"));
  assert.ok(
    json.results.some((r) => r.rule === "agent.step-budget-bounded"),
    "a rule the policy never mentions must still be reported, at its catalog level",
  );
});

test("the human report names unexamined prohibitions explicitly, and does not call them passes", () => {
  const r = validateRaw(fixture("valid-manifest"));
  assert.match(r.stdout, /Prohibitions nobody examined\. These are not passes:/);
});

test("the human report separates framework coverage from compliance", () => {
  const r = validateRaw(fixture("valid-manifest"));
  assert.match(r.stdout, /Framework coverage \(not a compliance measure\)/);
});

test("this repository's own verdict is honest about its own state", () => {
  // AIStandards has no ai-system.yml, so its manifest rules fail. That is deliberate and is NOT
  // resolved by declaring them not-applicable — see the note in ai-policy.yml. If someone later
  // exempts them to make this green, this test should be the thing that argues with them.
  const { json } = validate(REPO);
  assert.equal(json.project, "AIStandards");
  assert.equal(
    json.status,
    "NON_COMPLIANT",
    "at v0.1.0 this repository does not meet its own manifest requirement, and says so",
  );
  assert.equal(resultFor(json, "lifecycle.manifest-exists").result, "failed");
});

test("this repository's content-derived rules are WITHDRAWN, not passed, when the walk is shortened", () => {
  // test/fixtures is framework-excluded from the self-walk, and the fixtures contain deliberate
  // violations. A search that did not cover the repository must not report the repository clean.
  const { json } = validate(REPO);
  for (const rule of [
    "promptsec.prompt-is-versioned-artifact",
    "promptsec.no-inline-system-prompt",
    "misuse.safety-controls-not-disabled",
  ]) {
    const result = resultFor(json, rule);
    assert.equal(result.result, "skipped", `${rule} must be withdrawn`);
    assert.equal(result.disposition, "not-evaluated");
    assert.match(result.message, /shortened by a framework exclusion/);
  }
});

test("unavailable evidence never becomes a pass, across every fixture", () => {
  // The property that binds the whole design: nothing may be `passed` while its own evidence was
  // recorded as unavailable.
  for (const name of FIXTURES) {
    const { json } = validate(fixture(name));
    for (const r of json.results) {
      if (r.result !== "passed") continue;
      assert.ok(
        !/could not|unknown|unavailable|shortened/i.test(r.message),
        `${name}: ${r.rule} passed while reporting unavailable evidence: ${r.message}`,
      );
    }
  }
});
