// End-to-end: `init` with the REAL templates (<packRoot>/templates) satisfies ZERO rules.
//
// These tests use the pack's real templates and are deliberately unconditional: no skip. Where
// templates/ does not exist (for example a worker's isolated worktree before integration) they FAIL,
// with "cannot read the template registry" -- that is the correct outcome, because the property they
// assert cannot be established without the real templates. The same assertions run against a
// synthetic templates directory in test/init.test.mjs so the property has evidence in isolation.
//
// Proves: node --test --test-concurrency=1 test/init-e2e.test.mjs   (after templates/ is integrated)

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { runInitCommand } from "../scripts/init.mjs";
import { REPO, validate, audit, resultFor } from "./helpers.mjs";

const disposable = (name) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aistd-init-e2e-"));
  const target = path.join(root, name);
  fs.mkdirSync(target);
  return target;
};

function initReal(target, flags = []) {
  let out = ""; let err = "";
  const code = runInitCommand([target, ...flags], { stdout: { write: (s) => (out += s) }, stderr: { write: (s) => (err += s) } });
  return { code, out, err };
}

function assertZeroRulesSatisfied(target, label) {
  const v = validate(target);
  assert.ok(v.json, `${label}: validate must produce a verdict (exit ${v.code}): ${v.stderr}`);
  const passed = v.json.results.filter((r) => r.result === "passed").map((r) => r.rule);
  assert.deepEqual(passed, [], `${label}: initialization alone must satisfy zero rules; these passed: ${passed.join(", ")}`);
  assert.equal(resultFor(v.json, "lifecycle.manifest-not-scaffold").result, "failed", `${label}: the scaffold rule must fail`);
  assert.equal(v.json.status, "NON_COMPLIANT", label);
  assert.equal(v.code, 1, label);
  return v;
}

test("REAL TEMPLATES: before init there is no verdict; after init nothing passes and the status is NON_COMPLIANT", () => {
  for (const flags of [[], ["--docs"]]) {
    const label = `real templates ${flags.join(" ") || "(core)"}`;
    const target = disposable("adopter-project");
    const before = validate(target);
    assert.equal(before.code, 2, "no policy: a configuration error, never a pass");
    assert.equal(before.json, null, "no policy: no verdict envelope at all");
    const a0 = audit(target);
    assert.equal(a0.json.status, undefined, "audit emits no status");
    assert.equal(a0.json.score, undefined, "audit emits no score");

    const r = initReal(target, flags);
    assert.equal(r.code, 0, `${label}: init failed: ${r.err}`);
    assertZeroRulesSatisfied(target, label);

    const a1 = audit(target);
    assert.equal(a1.json.status, undefined, `${label}: audit still emits no status`);
    assert.equal(a1.json.score, undefined, `${label}: audit still emits no score`);
  }
});

test("REAL TEMPLATES: the policy resolved is the TARGET's, with cwd at the pack root", () => {
  const target = disposable("adopter-project");
  assert.equal(initReal(target).code, 0);
  const v = validate(target); // test/helpers.mjs spawns with cwd = the pack root, where a policy for AIStandards exists
  assert.ok(v.json, v.stderr);
  assert.ok(path.resolve(v.json.policyPath).startsWith(path.resolve(target)), `policyPath ${v.json.policyPath} must be under ${target}`);
  assert.equal(v.json.project, "adopter-project");
  assert.notEqual(v.json.project, "AIStandards");
});

test("REAL TEMPLATES: --docs writes only under docs/ai and changes nothing about the verdict", () => {
  const core = disposable("adopter-project"); const docs = disposable("adopter-project");
  assert.equal(initReal(core).code, 0);
  assert.equal(initReal(docs, ["--docs"]).code, 0);
  const vc = assertZeroRulesSatisfied(core, "core");
  const vd = assertZeroRulesSatisfied(docs, "docs");
  assert.deepEqual(vd.json.results.map((r) => [r.rule, r.result]), vc.json.results.map((r) => [r.rule, r.result]));
  assert.equal(vd.json.status, vc.json.status);
  assert.ok(fs.readdirSync(path.join(docs, "docs", "ai")).length > 0, "--docs must write at least one document");
  assert.ok(!fs.existsSync(path.join(core, "docs")), "control: core-only writes no docs directory");
});

test("REAL TEMPLATES: a repeat run is exit 0 with every file unchanged", () => {
  const target = disposable("adopter-project");
  assert.equal(initReal(target, ["--docs"]).code, 0);
  let out = "";
  const code = runInitCommand([target, "--docs", "--json"], { stdout: { write: (s) => (out += s) }, stderr: { write() {} } });
  assert.equal(code, 0);
  const j = JSON.parse(out);
  assert.ok(j.actions.length > 0 && j.actions.every((a) => a.action === "unchanged"));
});

test("REAL TEMPLATES: run as a script from the pack root with no target is refused", () => {
  const r = spawnSync(process.execPath, [path.join(REPO, "scripts", "init.mjs")], { cwd: REPO, encoding: "utf8" });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /target directory is required/);
});
