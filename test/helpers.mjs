// Shared test helpers.
//
// Tests spawn the real CLI as a subprocess and assert on its JSON output, rather than calling
// internal functions. That is deliberate: it exercises argument parsing, policy resolution, the
// file walk and serialisation — the wiring where the failures this pack cares about actually live.
// A unit test on `resolvePolicyPath` would not have caught the sibling-pack failure that
// target-relative resolution exists to prevent, because that failure was in the wiring.

import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, "..");
export const CLI = path.join(REPO, "scripts", "standards.mjs");

export const fixture = (name) => path.join(HERE, "fixtures", name);

function run(args, options = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    // cwd is this repository ON PURPOSE. A valid ai-policy.yml exists here, so any run against a
    // different target that picks up THIS policy is the failure the trap test looks for.
    cwd: options.cwd ?? REPO,
  });
  assert.equal(result.error, undefined, `spawn failed: ${result.error}`);
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

export function audit(dir, extra = []) {
  const r = run(["audit", `--dir=${dir}`, "--json", ...extra]);
  let json = null;
  try {
    json = JSON.parse(r.stdout);
  } catch {
    assert.fail(`audit stdout was not JSON.\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  }
  return { ...r, json };
}

export function auditRaw(dir, extra = []) {
  return run(["audit", `--dir=${dir}`, ...extra]);
}

export function validate(dir, extra = []) {
  const r = run(["validate", `--dir=${dir}`, "--json", ...extra]);
  let json = null;
  try {
    json = JSON.parse(r.stdout);
  } catch {
    json = null; // A configuration error emits no envelope. Callers assert on that.
  }
  return { ...r, json };
}

export function validateRaw(dir, extra = []) {
  return run(["validate", `--dir=${dir}`, ...extra]);
}

export const cli = run;

/** Every result whose rule matches, as a convenience for assertions. */
export const resultFor = (report, ruleId) => report.results.find((r) => r.rule === ruleId);

/** The set of distinction values present in a report. */
export const distinctionsIn = (report) => new Set(report.results.map((r) => r.distinction));
