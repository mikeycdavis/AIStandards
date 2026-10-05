// Catalog identity and the invariants that keep a rule from meaning two things.
//
// Every mutation test here corrupts a valid rule in exactly one way and asserts the loader REFUSES.
// The baseline assertion at the end matters as much as the mutations: if the loader rejected
// everything, every mutation test would pass and the suite would be measuring nothing.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadCatalog, resolve, CatalogError, RULE_ID, VALIDATION_TYPES, LEVELS, SEVERITIES, ASSURANCE } from "../scripts/catalog.mjs";
import { REPO } from "./helpers.mjs";

const catalog = loadCatalog();

test("the real catalog loads", () => {
  assert.ok(catalog.rules.size > 0, "the catalog must contain rules");
});

test("every rule id matches the canonical pattern", () => {
  for (const id of catalog.rules.keys()) {
    assert.match(id, RULE_ID, `${id} is not a canonical rule id`);
  }
});

test("every rule declares valid enum values", () => {
  for (const [id, rule] of catalog.rules) {
    assert.ok(LEVELS.has(rule.level), `${id} level`);
    assert.ok(SEVERITIES.has(rule.severity), `${id} severity`);
    assert.ok(VALIDATION_TYPES.has(rule.validationType), `${id} validationType`);
    assert.ok(ASSURANCE.has(rule.assurance), `${id} assurance`);
    assert.equal(typeof rule.nonExemptible, "boolean", `${id} nonExemptible`);
  }
});

test("lifecycle fields are present from the first release, even when null", () => {
  for (const [id, rule] of catalog.rules) {
    for (const field of ["aliases", "deprecatedIn", "supersededBy", "removedIn"]) {
      assert.ok(field in rule, `${id} is missing ${field}`);
    }
  }
});

test("every rule cites a standard number", () => {
  for (const [id, rule] of catalog.rules) {
    assert.ok(Number.isInteger(rule.standard) && rule.standard >= 1, `${id} must cite a standard`);
  }
});

test("attestable defaults to manual-review only, so attestation cannot become a universal override", () => {
  for (const [id, rule] of catalog.rules) {
    if (rule.validationType === "manual-review") {
      assert.equal(rule.attestable, true, `${id} is manual-review and should default attestable`);
    } else if (rule.validationType !== "not-evaluable" && !("attestable" in JSON.parse(
      fs.readFileSync(path.join(REPO, "rules", rule.shard), "utf8"),
    ).rules.find((r) => r.id === id))) {
      assert.equal(rule.attestable, false, `${id} must opt in to attestability explicitly`);
    }
  }
});

test("resolve() finds a rule by id", () => {
  const first = [...catalog.rules.keys()][0];
  assert.equal(resolve(catalog, first)?.id, first);
  assert.equal(resolve(catalog, "no.such-rule"), null);
});

// --- Mutation tests: each corrupts one field and asserts refusal ------------------------------

function withTempCatalog(rules, body) {
  const dir = fs.mkdtempSync(path.join(REPO, "test", ".tmp-catalog-"));
  try {
    fs.writeFileSync(path.join(dir, "probe.json"), JSON.stringify({ rules }));
    body(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const VALID = {
  id: "lifecycle.probe-rule",
  title: "Probe",
  standard: 1,
  category: "lifecycle",
  level: "required",
  severity: "error",
  validationType: "structural",
  assurance: "full",
  nonExemptible: false,
  introducedIn: "0.1.0",
  description: "A rule used only by the catalog tests.",
  rationale: "Mutation tests need a baseline that is accepted, or rejection is not informative.",
  remediation: "Nothing; this rule is a test fixture.",
  aliases: [],
  deprecatedIn: null,
  supersededBy: null,
  removedIn: null,
};

const MUTATIONS = {
  "a camelCase id": [{ ...VALID, id: "lifecycle.probeRule" }, /canonical id pattern/],
  "a foreign namespace": [{ ...VALID, id: "ai.probe-rule" }, /belongs to another pack/],
  "an unreserved namespace": [{ ...VALID, id: "nonsense.probe-rule" }, /unreserved namespace/],
  "an unknown level": [{ ...VALID, level: "mandatory" }, /unknown level/],
  "an unknown validationType": [{ ...VALID, validationType: "vibes" }, /unknown validationType/],
  "a missing lifecycle field": [(() => { const r = { ...VALID }; delete r.supersededBy; return r; })(), /lifecycle field/],
  "a missing required field": [(() => { const r = { ...VALID }; delete r.rationale; return r; })(), /required field/],
  "a not-evaluable rule with assurance other than none": [
    { ...VALID, validationType: "not-evaluable", assurance: "partial", $notEvaluableNote: "x".repeat(50) },
    /must declare assurance "none"/,
  ],
  "a not-evaluable rule that is attestable": [
    { ...VALID, validationType: "not-evaluable", assurance: "none", attestable: true, $notEvaluableNote: "x".repeat(50) },
    /must not be attestable/,
  ],
  "a not-evaluable rule that is nonExemptible": [
    { ...VALID, validationType: "not-evaluable", assurance: "none", nonExemptible: true, $notEvaluableNote: "x".repeat(50) },
    /must not be nonExemptible/,
  ],
  "a not-evaluable rule with a stub note": [
    { ...VALID, validationType: "not-evaluable", assurance: "none", $notEvaluableNote: "cannot be checked" },
    /at least 40 characters/,
  ],
  "a not-evaluable note on an evaluable rule": [
    { ...VALID, $notEvaluableNote: "x".repeat(50) },
    /but is not not-evaluable/,
  ],
  "a crosswalk to the rule's own id": [
    { ...VALID, crosswalk: [{ pack: "X", rule: "lifecycle.probe-rule", relationship: "precedent" }] },
    /crosswalks to its own id/,
  ],
  "an incomplete crosswalk": [
    { ...VALID, crosswalk: [{ pack: "X", rule: "y.z" }] },
    /missing pack, rule or relationship/,
  ],
};

for (const [name, [rule, expected]] of Object.entries(MUTATIONS)) {
  test(`the catalog refuses ${name}`, () => {
    withTempCatalog([rule], (dir) => {
      assert.throws(() => loadCatalog(dir), (err) => {
        assert.ok(err instanceof CatalogError, `expected CatalogError, got ${err}`);
        assert.match(err.message, expected);
        return true;
      });
    });
  });
}

test("every mutation is rejected AND the baseline is accepted, so rejection is not the default", () => {
  withTempCatalog([VALID], (dir) => {
    const probe = loadCatalog(dir);
    assert.equal(probe.rules.size, 1, "the unmutated baseline must load");
  });
});

test("a duplicate rule id is refused", () => {
  withTempCatalog([VALID, { ...VALID }], (dir) => {
    assert.throws(() => loadCatalog(dir), /duplicate rule id/);
  });
});
