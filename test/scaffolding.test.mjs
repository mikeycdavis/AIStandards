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
