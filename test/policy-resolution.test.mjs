// The policy-resolution trap.
//
// This is the single most important test in the suite, because the failure it guards against is
// the one a compliance tool cannot recover from: producing a confident verdict about the wrong
// repository. A sibling pack in this portfolio does exactly that — absent an explicit policy path
// it reads its OWN policy, labels the report with its OWN project name, and exits 0.
//
// Note the working directory: every helper spawns the CLI with cwd set to THIS repository, where a
// valid ai-policy.yml exists. A resolver that fell back to the process cwd, or to the pack root,
// would pick it up and these tests would catch it.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolvePolicyPath, loadPolicy, PolicyError, POLICY_BASENAME } from "../scripts/policy.mjs";
import { validate, validateRaw, cli, fixture, REPO } from "./helpers.mjs";

test("THE TRAP: a target's verdict names the target, never this checkout", () => {
  const { json } = validate(fixture("policy-elsewhere"));
  assert.ok(json, "an envelope must be produced");
  assert.equal(json.project, "policy-elsewhere", "the report must name the TARGET project");
  assert.notEqual(json.project, "AIStandards", "the report must never name this pack");
});

test("THE TRAP: the policy path resolves under the target, never under this checkout", () => {
  const { json } = validate(fixture("policy-elsewhere"));
  const resolved = path.resolve(json.policyPath);
  assert.ok(
    resolved.startsWith(path.resolve(fixture("policy-elsewhere"))),
    `policyPath ${resolved} must be inside the target`,
  );
  assert.ok(
    !resolved.startsWith(path.join(REPO, POLICY_BASENAME)),
    "policyPath must never be this pack's own policy",
  );
  assert.equal(json.policySource, "target-default");
});

test("resolvePolicyPath has no parameter that could name this checkout", () => {
  // Structural, not careful coding: the failure is unrepresentable rather than merely avoided.
  // `.length` counts parameters before the first default, so (target, explicit = null) reports 1.
  // What matters is the source: there is no third parameter, and none named for the pack root.
  const source = resolvePolicyPath.toString();
  assert.match(source, /^function resolvePolicyPath\(target, explicit = null\)/);
  assert.ok(!/packRoot|REPO_ROOT|__dirname|import\.meta/.test(source),
    "nothing in the resolver may reference this checkout");
  const out = resolvePolicyPath("/some/target");
  assert.equal(out.source, "target-default");
  assert.equal(path.resolve(out.path), path.resolve(path.join("/some/target", POLICY_BASENAME)));
});

test("policySource has exactly two values, and no third", () => {
  const def = validate(fixture("policy-elsewhere")).json;
  assert.equal(def.policySource, "target-default");

  const explicitPath = path.join(fixture("policy-elsewhere"), POLICY_BASENAME);
  const exp = validate(fixture("policy-elsewhere"), [`--policy=${explicitPath}`]).json;
  assert.equal(exp.policySource, "explicit");
  assert.equal(path.resolve(exp.policyPath), path.resolve(explicitPath));
});

test("a target with no policy exits 2 and emits NO envelope", () => {
  const r = validateRaw(fixture("policy-missing"), ["--json"]);
  assert.equal(r.code, 2, "a missing policy is a configuration error, not a compliance failure");
  assert.equal(r.stdout.trim(), "", "no envelope may be emitted for a run with nothing to evaluate");
  assert.match(r.stderr, /no policy at/);
  // Specifically NOT a status a consumer could parse.
  assert.ok(!/COMPLIANT|NOT_EVALUATED|NON_COMPLIANT/.test(r.stdout));
});

test("negative control: the same target WITH a policy produces an envelope", () => {
  // Without this, a resolver that always failed would satisfy the test above.
  const r = validateRaw(fixture("valid-manifest"), ["--json"]);
  assert.notEqual(r.code, 2);
  assert.ok(JSON.parse(r.stdout).status, "a target with a policy must produce a status");
});

test("a version-mismatched policy exits 2 and emits no envelope", () => {
  const r = validateRaw(fixture("policy-version-mismatch"), ["--json"]);
  assert.equal(r.code, 2);
  assert.equal(r.stdout.trim(), "");
  assert.match(r.stderr, /9\.9\.9/);
  assert.match(r.stderr, /worse than no verdict/);
});

test("a policy naming a rule the catalog does not define is refused", () => {
  const dir = fs.mkdtempSync(path.join(REPO, "test", ".tmp-policy-"));
  try {
    fs.writeFileSync(
      path.join(dir, POLICY_BASENAME),
      'standardVersion: "0.1.0"\nproject: "probe"\nrules:\n  nonsense.not-a-rule:\n    level: required\n',
    );
    const r = validateRaw(dir, ["--json"]);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /nonsense\.not-a-rule/);
    assert.match(r.stderr, /another standards pack/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a malformed policy is a configuration error, not a compliance failure", () => {
  const dir = fs.mkdtempSync(path.join(REPO, "test", ".tmp-policy-"));
  try {
    fs.writeFileSync(path.join(dir, POLICY_BASENAME), "standardVersion: |\n  a block scalar\n");
    const r = validateRaw(dir, ["--json"]);
    assert.equal(r.code, 2);
    assert.equal(r.stdout.trim(), "");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("loadPolicy refuses a file that does not exist rather than returning an empty policy", () => {
  assert.throws(
    () => loadPolicy(path.join(REPO, "no-such-policy.yml"), { type: "object" }),
    (err) => {
      assert.ok(err instanceof PolicyError);
      assert.match(err.message, /nothing to evaluate/);
      return true;
    },
  );
});

test("audit refuses --policy rather than accepting and ignoring it", () => {
  const audit = cli(["audit", `--dir=${fixture("valid-manifest")}`, "--policy=x.yml"]);
  assert.equal(audit.code, 2, "a flag that cannot apply is an invocation error, not a silent no-op");
  assert.match(audit.stderr, /produces no verdict/i);
});
