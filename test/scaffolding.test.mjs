// Scaffolding is not evidence.
//
// This module exists before the bootstrap that will need it. A sibling pack records that building
// them the other way round let its bootstrap write evidence its own evaluator accepted, flipping
// three required rules to passed with no work done.

import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectScaffolding, isPlaceholder, SCAFFOLD_MARKER } from "../scripts/scaffolding.mjs";
import { validate, fixture, resultFor } from "./helpers.mjs";

test("the marker alone is enough", () => {
  const out = inspectScaffolding({ [SCAFFOLD_MARKER]: true, a: "a real value" });
  assert.equal(out.scaffold, true);
  assert.match(out.reasons.join(" "), /marker/);
});

test("placeholder-only substance is enough, without a marker", () => {
  const out = inspectScaffolding({ a: "REPLACE-ME", b: "TODO" });
  assert.equal(out.scaffold, true);
  assert.match(out.reasons.join(" "), /every declared value/);
});

test("recognised placeholder shapes", () => {
  for (const value of ["REPLACE-ME", "replace_me", "TODO", "TBD", "FIXME", "<name>", "xxx", "...", "", "   "]) {
    assert.equal(isPlaceholder(value), true, `${JSON.stringify(value)} should be a placeholder`);
  }
});

test("real values are not placeholders", () => {
  for (const value of ["Support Triage Assistant", "claude-sonnet-4-5-20250929", "a", 42, true, null]) {
    assert.equal(isPlaceholder(value), false, `${JSON.stringify(value)} is not a placeholder`);
  }
});

test("THE CONTROL: a partially-filled document is NOT scaffolding", () => {
  // The threshold is EVERY scalar, not most. A half-filled manifest is a project mid-adoption,
  // which is the honest state of every project on its first day. A rule that punished it would be
  // switched off.
  const out = inspectScaffolding({ a: "a real value", b: "REPLACE-ME" });
  assert.equal(out.scaffold, false, "a project halfway through adoption must not be called a template");
  assert.deepEqual(out.placeholders, ["b"], "the placeholder is still reported, just not as scaffolding");
});

test("a fully-written document is not scaffolding", () => {
  const out = inspectScaffolding({ a: "real", b: { c: "also real" }, d: [1, 2] });
  assert.equal(out.scaffold, false);
  assert.deepEqual(out.placeholders, []);
});

test("the marker key itself is not counted as a value", () => {
  // Otherwise a marker set to `false` would count as a real scalar and dilute the substance check.
  const out = inspectScaffolding({ [SCAFFOLD_MARKER]: false, a: "REPLACE-ME" });
  assert.equal(out.scaffold, true, "one real-looking key must not rescue an all-placeholder document");
});

test("nested placeholders are found and reported by path", () => {
  const out = inspectScaffolding({ system: { name: "REPLACE-ME" }, models: [{ id: "TODO" }] });
  assert.equal(out.scaffold, true);
  assert.deepEqual(out.placeholders.sort(), ["models[0].id", "system.name"]);
});

test("end to end: a scaffold manifest fails, a written one passes", () => {
  assert.equal(
    resultFor(validate(fixture("scaffold-manifest")).json, "lifecycle.manifest-not-scaffold").result,
    "failed",
  );
  assert.equal(
    resultFor(validate(fixture("valid-manifest")).json, "lifecycle.manifest-not-scaffold").result,
    "passed",
  );
});

test("a scaffold manifest does not raise the score", () => {
  // The failure this module exists to prevent, stated as an assertion: generated content must never
  // make a project look more compliant than an empty repository.
  const scaffold = validate(fixture("scaffold-manifest")).json;
  const none = validate(fixture("no-manifest")).json;
  assert.ok(
    scaffold.summary.failed >= 1,
    "a generated manifest must not clear the manifest rules",
  );
  assert.ok(
    scaffold.score <= none.score + 20,
    `scaffolding raised the score from ${none.score} to ${scaffold.score} — the bootstrap would be writing its own evidence`,
  );
});

// --- Scaffolding is not evidence for ANY rule that reads it --------------------------------------
//
// A scaffold manifest is schema-valid by construction. Before the detectors were corrected it made
// lifecycle.manifest-exists and lifecycle.manifest-valid pass, and made both gate rules pass
// vacuously because a scaffold declares no tools — four rules cleared by writing a file, which is
// exactly the incident this module exists to prevent. The weaker assertion above (the score rises by
// at most 20) let that stand; these do not.

import { hasScaffoldTextMarker, SCAFFOLD_TEXT_MARKER } from "../scripts/scaffolding.mjs";

test("a scaffold manifest satisfies ZERO rules, and only the scaffold rule reports on it", () => {
  const json = validate(fixture("scaffold-manifest")).json;
  const passed = json.results.filter((r) => r.result === "passed").map((r) => r.rule);
  assert.deepEqual(passed, [], "generated content must not clear any rule");
  assert.equal(resultFor(json, "lifecycle.manifest-not-scaffold").result, "failed");
  for (const rule of ["lifecycle.manifest-exists", "lifecycle.manifest-valid", "gate.tool-permission-manifest", "gate.actions-classified"]) {
    const r = resultFor(json, rule);
    assert.equal(r.result, "skipped", `${rule} must not pass on scaffolding`);
    assert.equal(r.disposition, "not-evaluated");
    assert.match(r.message, /scaffolding/i, `${rule} must say why`);
  }
});

test("THE CONTROL: a written manifest still passes the rules the scaffold does not", () => {
  const json = validate(fixture("valid-manifest")).json;
  for (const rule of ["lifecycle.manifest-exists", "lifecycle.manifest-valid", "lifecycle.manifest-not-scaffold"]) {
    assert.equal(resultFor(json, rule).result, "passed", `${rule} is the positive control`);
  }
});

test("a scaffold permission file beside a real manifest satisfies neither gate rule", () => {
  const json = validate(fixture("scaffold-tool-permissions")).json;
  for (const rule of ["gate.tool-permission-manifest", "gate.actions-classified"]) {
    const r = resultFor(json, rule);
    assert.equal(r.result, "skipped", `${rule} must not pass on a scaffold permission file`);
    assert.equal(r.disposition, "not-evaluated");
    assert.match(r.message, /scaffolding/i);
  }
  // The manifest itself is real, so its own rules are unaffected.
  assert.equal(resultFor(json, "lifecycle.manifest-not-scaffold").result, "passed");
});

test("THE CONTROL: a completed permission file still satisfies both gate rules", () => {
  const json = validate(fixture("declared-tools")).json;
  assert.equal(resultFor(json, "gate.tool-permission-manifest").result, "passed");
  assert.equal(resultFor(json, "gate.actions-classified").result, "passed");
});

test("the text marker is recognised on the first non-blank line only, in YAML and Markdown form", () => {
  assert.equal(SCAFFOLD_TEXT_MARKER, "AISTANDARDS-SCAFFOLD");
  assert.equal(hasScaffoldTextMarker(`# ${SCAFFOLD_TEXT_MARKER}: replace this\nstandardVersion: "0.1.0"\n`), true);
  assert.equal(hasScaffoldTextMarker(`\n\r\n  # ${SCAFFOLD_TEXT_MARKER}\nx: 1\n`), true, "leading blank lines are skipped");
  assert.equal(hasScaffoldTextMarker(`<!-- ${SCAFFOLD_TEXT_MARKER}: template -->\n# Title\n`), true);
  assert.equal(hasScaffoldTextMarker(`<!-- ${SCAFFOLD_TEXT_MARKER}: template -->\r\n# Title\r\n`), true, "CRLF");
  // NEGATIVE CONTROLS: a document that merely mentions the marker is not a scaffold.
  assert.equal(hasScaffoldTextMarker(`# Notes\nThe marker is ${SCAFFOLD_TEXT_MARKER}.\n`), false, "not on the first line");
  assert.equal(hasScaffoldTextMarker(`standardVersion: "${SCAFFOLD_TEXT_MARKER}"\n`), false, "not a comment");
  assert.equal(hasScaffoldTextMarker(""), false);
  assert.equal(hasScaffoldTextMarker(null), false);
});
