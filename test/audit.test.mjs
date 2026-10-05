// Audit: evidence discovery, and the detectors.
//
// EVERY DETECTOR IS ASSERTED TWICE — once on a fixture that must provoke it, and once on a fixture
// that must not. THE SECOND ASSERTION IS THE ONE THAT MATTERS. The detectors in this pack are more
// heuristic than most: a false positive on a prompt-security rule gets that rule switched off by an
// adopting team within a week, at which point it enforces nothing at all.

import { test } from "node:test";
import assert from "node:assert/strict";
import { audit, auditRaw, validate, fixture, resultFor } from "./helpers.mjs";

// --- The audit envelope is evidence, and says so ----------------------------------------------

test("audit emits NO status and NO score", () => {
  const { json } = audit(fixture("no-manifest"));
  assert.ok(!("status" in json), "audit must never carry a status");
  assert.ok(!("score" in json), "audit must never carry a score");
  assert.ok(!("results" in json), "audit reports findings, not rule results");
});

test("audit states that it is not a verdict, in JSON and in human output", () => {
  const { json } = audit(fixture("no-manifest"));
  assert.equal(json.notAVerdict, "This is evidence, not a verdict.");

  const human = auditRaw(fixture("no-manifest"));
  assert.match(human.stdout, /This is evidence, not a verdict\./);
  assert.match(human.stdout, /does not produce one/);
});

test("audit needs no policy — a target with none still produces evidence", () => {
  const r = auditRaw(fixture("policy-missing"), ["--json"]);
  assert.equal(r.code, 0, "audit must not require a policy");
  assert.ok(JSON.parse(r.stdout).findings);
});

test("audit exits 0 on findings; only --strict changes that", () => {
  assert.equal(auditRaw(fixture("no-manifest")).code, 0, "a finding is evidence, not a failure");
});

test("the evidence surface records what the tool chose not to read", () => {
  const { json } = audit(".");
  const framework = json.evidenceSurface.frameworkExcludedDirectories;
  assert.ok(
    framework.includes("test/fixtures"),
    "a framework exclusion must be recorded — it is the only kind that invalidates completeness",
  );
  const authorities = new Set(json.evidenceSurface.excludedDirectories.map((d) => d.authorizedBy));
  for (const a of authorities) {
    assert.ok(["not-project-evidence", "framework"].includes(a), `unknown exclusion authority ${a}`);
  }
});

test("descriptive findings carry no rule binding", () => {
  const { json } = audit(fixture("file-backed-prompt"));
  for (const f of json.findings) {
    assert.equal(f.rule, null, `${f.id} is descriptive and must not be bound to a rule`);
    assert.ok(["OBSERVED", "INFERRED"].includes(f.label));
  }
});

// --- Detector pairs. Provoking fixture, then the control ---------------------------------------

const violated = (name, rule) => resultFor(validate(fixture(name)).json, rule)?.result;

// A control must produce no violation AND the expected distinction. For a full-assurance rule that
// is `passed`. For a partial-assurance rule a clean search is NOT a pass (Standard 5 R6, Q13): it is
// `not-evaluated`, or `prohibited-but-unestablished` at forbidden level. Both halves are asserted, so
// the "no false violation" guarantee is kept rather than dropped along with the pass.
function assertControl(name, rule, distinction) {
  const r = resultFor(validate(fixture(name)).json, rule);
  assert.ok(r, `${name} must report ${rule}`);
  assert.ok(
    !["failed", "warning"].includes(r.result),
    `${rule} must not fire on ${name}; got ${r.result}: ${r.message}`,
  );
  assert.equal(r.distinction, distinction, `${rule} on ${name}: ${r.message}`);
}

// [rule, provoking fixture, control fixture, the control's required distinction]
const PAIRS = [
  ["lifecycle.manifest-exists", "no-manifest", "valid-manifest", "passed"],
  ["lifecycle.manifest-valid", "invalid-manifest", "valid-manifest", "passed"],
  ["lifecycle.manifest-not-scaffold", "scaffold-manifest", "valid-manifest", "passed"],
  ["lifecycle.model-version-pinned", "floating-model-alias", "pinned-model", "not-evaluated"],
  ["gate.tool-permission-manifest", "no-tool-permissions", "declared-tools", "passed"],
  ["gate.actions-classified", "undeclared-tool", "declared-tools", "passed"],
  ["promptsec.prompt-is-versioned-artifact", "inline-system-prompt", "file-backed-prompt", "not-evaluated"],
  ["misuse.safety-controls-not-disabled", "disabled-safety", "safety-configured", "prohibited-but-unestablished"],
];

for (const [rule, provoking, control, controlDistinction] of PAIRS) {
  test(`${rule} fires on ${provoking}`, () => {
    const result = violated(provoking, rule);
    assert.ok(["failed", "warning"].includes(result), `expected a violation, got ${result}`);
  });

  test(`${rule} does NOT fire on ${control} — the control`, () => {
    assertControl(control, rule, controlDistinction);
  });
}

test("a manifest declaring no tools does not owe a permission manifest", () => {
  // The control that keeps gate.tool-permission-manifest from firing on every text-only system.
  assert.equal(violated("valid-manifest", "gate.tool-permission-manifest"), "passed");
});

test("a recommended-level prompt rule warns rather than fails", () => {
  assert.equal(violated("inline-system-prompt", "promptsec.no-inline-system-prompt"), "warning");
  assert.equal(violated("inline-system-prompt", "promptsec.prompt-is-versioned-artifact"), "failed");
});

// --- The control that matters most --------------------------------------------------------------

test("MENTIONS-ONLY: prose and comments describing a violation produce ZERO violations", () => {
  const { json } = validate(fixture("mentions-only"));
  const violations = json.results.filter((r) => r.result === "failed" || r.result === "warning");
  assert.deepEqual(
    violations.map((r) => `${r.rule}: ${r.message}`),
    [],
    "a repository that DOCUMENTS these problems must not be reported as having them",
  );
});

test("mentions-only exercises the Python floor-division trap", () => {
  // `//` opens a comment in JavaScript and is floor division in Python. A scanner using the wrong
  // comment syntax discards the rest of the file, which can hide a real finding as easily as it
  // invents one.
  const { json } = audit(fixture("mentions-only"));
  assert.ok(
    json.evidenceSurface.filesCollected >= 4,
    "the fixture's Python file must actually be collected, or the trap is untested",
  );
});

test("a floating alias named in prose is not a floating alias in use", () => {
  // Partial assurance: no violation, and not a pass either.
  assertControl("mentions-only", "lifecycle.model-version-pinned", "not-evaluated");
});

test("BLOCK_NONE named in a comment is not BLOCK_NONE in configuration", () => {
  // Partial assurance at forbidden level: no violation, and an unestablished prohibition.
  assertControl("mentions-only", "misuse.safety-controls-not-disabled", "prohibited-but-unestablished");
});
